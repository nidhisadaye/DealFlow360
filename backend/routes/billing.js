const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole, InvoiceStatus, SubscriptionStatus } = require('../config/enums');
const logEvent = require('../utils/logEvent');

const router = express.Router();

const serializeBillingRow = (row) => ({
  ...row,
  amount: Number(row.amount || 0),
});

// GET /api/deals/:id/billing — get billing info for one deal
router.get('/deals/:id/billing', authenticate, async (req, res) => {
  try {
    const dealId = req.params.id;

    const [dealRows] = await pool.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (dealRows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    const [invoices] = await pool.query('SELECT * FROM invoices WHERE deal_id = ? ORDER BY created_at DESC', [dealId]);
    const [subscriptions] = await pool.query('SELECT * FROM subscriptions WHERE deal_id = ? ORDER BY created_at DESC', [dealId]);

    res.json({
      success: true,
      data: {
        dealId,
        invoice: invoices[0] ? serializeBillingRow(invoices[0]) : null,
        subscriptions: subscriptions.map(serializeBillingRow),
      },
      meta: {
        totalInvoices: invoices.length,
        totalSubscriptions: subscriptions.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/invoices — create an invoice for a deal
router.post('/deals/:id/invoices', authenticate, authorize(UserRole.FINANCE_OPERATIONS, UserRole.ADMIN, UserRole.SALES_MANAGER), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { invoiceType = 'ONE_TIME', amount, currency = 'INR', dueDate, status = InvoiceStatus.ISSUED } = req.body || {};

    const [dealRows] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (dealRows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    const deal = dealRows[0];
    if (amount === undefined || amount === null) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'amount is required.' },
      });
    }

    const invoiceId = `INV-${Date.now()}`;

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO invoices (id, deal_id, customer_id, invoice_type, amount, currency, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, dealId, deal.customer_id, invoiceType, Number(amount), currency, status, dueDate || null]
    );

    await logEvent(dealId, 'BILLING_CREATED', req.user.id, `Invoice created for deal ${dealId}.`, { invoiceId, amount, invoiceType }, conn);

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      data: {
        id: invoiceId,
        dealId,
        customerId: deal.customer_id,
        invoiceType,
        amount: Number(amount),
        currency,
        status,
        dueDate: dueDate || null,
      },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/deals/:id/subscriptions — list subscriptions for one deal
router.get('/deals/:id/subscriptions', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE deal_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: rows.map(serializeBillingRow), meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/subscriptions — create a subscription for a deal
router.post('/deals/:id/subscriptions', authenticate, authorize(UserRole.FINANCE_OPERATIONS, UserRole.ADMIN, UserRole.SALES_MANAGER), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { productId, billingInterval, amount, startDate, nextBillingDate } = req.body || {};

    const [dealRows] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (dealRows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    if (!productId || !billingInterval || amount === undefined || amount === null) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'productId, billingInterval, and amount are required.' },
      });
    }

    const subscriptionId = `SUB-${Date.now()}`;

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO subscriptions (id, deal_id, product_id, billing_interval, amount, start_date, next_billing_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subscriptionId, dealId, productId, billingInterval, Number(amount), startDate || null, nextBillingDate || null, SubscriptionStatus.ACTIVE]
    );

    await logEvent(dealId, 'BILLING_CREATED', req.user.id, `Subscription created for deal ${dealId}.`, { subscriptionId, billingInterval, amount }, conn);

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      data: {
        id: subscriptionId,
        dealId,
        productId,
        billingInterval,
        amount: Number(amount),
        startDate: startDate || null,
        nextBillingDate: nextBillingDate || null,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// Extra list endpoints retained for convenience
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json({ success: true, data: rows.map(serializeBillingRow), meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscriptions ORDER BY created_at DESC');
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
