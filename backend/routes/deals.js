const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const logEvent = require('../utils/logEvent');

const router = express.Router();

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));

function serializeDeal(deal) {
  return {
    ...deal,
    subtotal: toNumber(deal.subtotal),
    discount_amount: toNumber(deal.discount_amount),
    total_amount: toNumber(deal.total_amount),
    cost_amount: toNumber(deal.cost_amount),
    margin_amount: toNumber(deal.margin_amount),
    margin_percent: toNumber(deal.margin_percent),
    risk_score: toNumber(deal.risk_score),
  };
}

// POST /api/deals — create a deal with items
router.post('/', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { customerId, title, items, discountPercent } = req.body || {};
    const normalizedDiscount = Number(discountPercent || 0);

    if (!customerId || !title || !Array.isArray(items) || items.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'customerId, title, and at least one item are required.' },
      });
    }

    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > 100) {
      conn.release();
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'discountPercent must be between 0 and 100.' } });
    }

    const [customers] = await conn.query('SELECT id FROM customers WHERE id = ? AND is_active = TRUE', [customerId]);
    if (customers.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'An active customer is required.' } });
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    if (productIds.some((productId) => !productId)) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Each item must reference a product.' },
      });
    }

    const placeholders = productIds.map(() => '?').join(', ');
    const [productRows] = await conn.query(
      `SELECT id, name, billing_type, sale_price, cost_price
       FROM products
       WHERE id IN (${placeholders}) AND is_active = TRUE`,
      productIds
    );
    const productsById = new Map(productRows.map((product) => [product.id, product]));
    const missingProduct = productIds.find((productId) => !productsById.has(productId));

    if (missingProduct) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Active product ${missingProduct} was not found.` },
      });
    }

    await conn.beginTransaction();

    const dealId = `DEAL-${Date.now()}`;
    const salesRepId = req.user.id;

    let subtotal = 0;
    let costAmount = 0;

    const normalizedItems = items.map((item) => {
      const product = productsById.get(item.productId);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(`Quantity for product ${item.productId} must be a positive integer.`);
      }

      const unitPrice = Number(product.sale_price);
      const unitCost = Number(product.cost_price);
      subtotal += unitPrice * quantity;
      costAmount += unitCost * quantity;

      return {
        ...item,
        productName: product.name,
        quantity,
        unitPrice,
        unitCost,
        billingType: product.billing_type,
      };
    });

    for (const item of normalizedItems) {
      if (item.discountPercent !== undefined && (Number(item.discountPercent) < 0 || Number(item.discountPercent) > 100)) {
        throw new Error(`Discount for product ${item.productId} must be between 0 and 100.`);
      }
    }

    const discountAmount = subtotal * (normalizedDiscount / 100);
    const totalAmount = subtotal - discountAmount;
    const marginAmount = totalAmount - costAmount;
    const marginPercent = totalAmount > 0 ? (marginAmount / totalAmount) * 100 : 0;

    await conn.query(
      `INSERT INTO deals (id, customer_id, sales_rep_id, title, status, discount_percent, subtotal, discount_amount, total_amount, cost_amount, margin_amount, margin_percent)
       VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?)`,
      [dealId, customerId, salesRepId, title.trim(), normalizedDiscount, subtotal, discountAmount, totalAmount, costAmount, marginAmount, marginPercent]
    );

    for (const item of normalizedItems) {
      const itemId = `DI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscount = itemSubtotal * ((item.discountPercent || 0) / 100);
      const itemTotal = itemSubtotal - itemDiscount;

      await conn.query(
        `INSERT INTO deal_items (id, deal_id, product_id, product_name, quantity, unit_price, unit_cost, billing_type, recurring_interval, discount_percent, subtotal, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, dealId, item.productId, item.productName, item.quantity, item.unitPrice, item.unitCost, item.billingType, item.recurringInterval || null, item.discountPercent || 0, itemSubtotal, itemTotal]
      );
    }

    await logEvent(dealId, 'DEAL_CREATED', salesRepId, `Deal "${title}" created.`, null, conn);
    await conn.commit();
    conn.release();

    res.json({ success: true, data: { id: dealId, status: 'DRAFT', subtotal, totalAmount } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/deals/summary — KPI totals across the complete filtered result set
router.get('/summary', authenticate, async (req, res) => {
  try {
    const params = [];
    const where = [];
    if (req.query.status) { where.push('d.status = ?'); params.push(req.query.status); }
    if (req.query.search) {
      where.push('(d.id LIKE ? OR d.title LIKE ? OR c.name LIKE ? OR c.company LIKE ?)');
      const term = `%${String(req.query.search).trim()}%`;
      params.push(term, term, term, term);
    }
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN d.status IN ('DRAFT','UNDER_REVIEW','APPROVAL_REQUIRED','NEGOTIATION','REAPPROVAL_REQUIRED') THEN d.total_amount ELSE 0 END), 0) AS open_pipeline,
        COALESCE(SUM(CASE WHEN d.status IN ('APPROVED','FULFILLMENT_PENDING','READY_TO_BILL') THEN d.total_amount ELSE 0 END), 0) AS approved_value,
        COALESCE(SUM(CASE WHEN d.status IN ('APPROVAL_REQUIRED','REAPPROVAL_REQUIRED') THEN 1 ELSE 0 END), 0) AS needs_attention,
        COALESCE(SUM(CASE WHEN YEAR(d.created_at) = YEAR(CURRENT_DATE) AND MONTH(d.created_at) = MONTH(CURRENT_DATE) THEN 1 ELSE 0 END), 0) AS created_this_month,
        COALESCE(SUM(CASE WHEN YEAR(d.created_at) = YEAR(CURRENT_DATE) AND MONTH(d.created_at) = MONTH(CURRENT_DATE) THEN d.total_amount ELSE 0 END), 0) AS created_this_month_value
       FROM deals d JOIN customers c ON c.id = d.customer_id ${condition}`,
      params
    );
    res.json({
      success: true,
      data: {
        total: toNumber(summary.total),
        open_pipeline: toNumber(summary.open_pipeline),
        approved_value: toNumber(summary.approved_value),
        needs_attention: toNumber(summary.needs_attention),
        created_this_month: toNumber(summary.created_this_month),
        created_this_month_value: toNumber(summary.created_this_month_value),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/deals — list all deals with pagination and display names
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];
    if (req.query.status) { where.push('d.status = ?'); params.push(req.query.status); }
    if (req.query.search) {
      where.push('(d.id LIKE ? OR d.title LIKE ? OR c.name LIKE ? OR c.company LIKE ?)');
      const term = `%${String(req.query.search).trim()}%`;
      params.push(term, term, term, term);
    }
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM deals d JOIN customers c ON c.id = d.customer_id ${condition}`, params);
    const [deals] = await pool.query(
      `SELECT d.*, c.name AS customer_name, c.company AS customer_company, u.name AS owner_name
       FROM deals d JOIN customers c ON c.id = d.customer_id JOIN users u ON u.id = d.sales_rep_id
       ${condition} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: deals.map(serializeDeal),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/deals/:id — get one deal with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [deals] = await pool.query('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (deals.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }
    const [items] = await pool.query('SELECT * FROM deal_items WHERE deal_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...deals[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/deals/:id — update a deal (basic fields only for now)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, status, discountPercent } = req.body || {};
    const [existing] = await pool.query('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    await pool.query(
      'UPDATE deals SET title = COALESCE(?, title), status = COALESCE(?, status), discount_percent = COALESCE(?, discount_percent) WHERE id = ?',
      [title, status, discountPercent, req.params.id]
    );

    res.json({ success: true, data: { id: req.params.id, message: 'Deal updated.' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
