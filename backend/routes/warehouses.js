const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');
const { DealStatus, DealEventType, VALID_TRANSITIONS } = require('../config/enums');
const logEvent = require('../utils/logEvent');

const router = express.Router();

// GET /api/fulfillment/summary - live fulfillment KPIs
router.get('/fulfillment/summary', authenticate, async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COALESCE(SUM(d.status = 'FULFILLMENT_PENDING'), 0) AS pending_fulfillment,
        COALESCE(COUNT(wa.id), 0) AS allocation_count
      FROM deals d
      LEFT JOIN warehouse_allocations wa ON wa.deal_id = d.id
    `);
    res.json({
      success: true,
      data: {
        pendingFulfillment: Number(summary.pending_fulfillment || 0),
        allocationCount: Number(summary.allocation_count || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to load fulfillment summary.' } });
  }
});

// GET /api/warehouses — list active warehouses
router.get('/warehouses', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM warehouses WHERE is_active = TRUE ORDER BY name');
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.post('/warehouses', authenticate, authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const { name, location } = req.body || {};
    if (!name || !location) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Warehouse name and location are required.' } });
    const id = `WH-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await pool.query('INSERT INTO warehouses (id, name, location, is_active) VALUES (?, ?, ?, TRUE)', [id, String(name).trim(), String(location).trim()]);
    res.status(201).json({ success: true, data: { id, name: String(name).trim(), location: String(location).trim(), is_active: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to add warehouse.' } });
  }
});

// GET /api/products/:id/inventory — real per-warehouse stock for a product
router.get('/products/:id/inventory', authenticate, async (req, res) => {
  try {
    const productId = req.params.id;

    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (product.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    const [rows] = await pool.query(
      `SELECT i.warehouse_id AS warehouseId, w.name AS warehouseName,
              GREATEST(i.available_quantity - i.reserved_quantity, 0) AS availableQuantity,
              i.reserved_quantity AS reservedQuantity,
              i.updated_at AS updatedAt
       FROM inventory i
       JOIN warehouses w ON w.id = i.warehouse_id
       WHERE i.product_id = ?
       ORDER BY i.available_quantity DESC`,
      [productId]
    );

    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/allocate — persist a warehouse split for a deal
// Body: { allocations: [ { warehouseId, warehouseName, productId, quantity, status }, ... ] }
// status per line: ALLOCATED | PARTIAL | UNAVAILABLE
router.post('/deals/:id/allocate', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { allocations } = req.body || {};

    if (!Array.isArray(allocations) || allocations.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'allocations must be a non-empty array.' },
      });
    }

    const [deals] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (deals.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    await conn.beginTransaction();

    const insertedRows = [];

    for (const alloc of allocations) {
      const { warehouseId, warehouseName, productId, quantity, status } = alloc;
      const requestedQuantity = Number(quantity);

      if (!warehouseId || !warehouseName || !productId || !Number.isInteger(requestedQuantity) || requestedQuantity <= 0 || !status) {
        throw Object.assign(
          new Error('Each allocation needs warehouseId, warehouseName, productId, quantity, and status.'),
          { code: 'VALIDATION_ERROR' }
        );
      }

      const [inventoryRows] = await conn.query(
        `SELECT available_quantity, reserved_quantity FROM inventory
         WHERE warehouse_id = ? AND product_id = ? FOR UPDATE`,
        [warehouseId, productId]
      );
      const inventory = inventoryRows[0];
      const sellableQuantity = inventory
        ? Number(inventory.available_quantity) - Number(inventory.reserved_quantity)
        : 0;
      if (status === 'ALLOCATED' && requestedQuantity > sellableQuantity) {
        throw Object.assign(new Error(`Only ${Math.max(sellableQuantity, 0)} unit(s) are available at this warehouse.`), { code: 'VALIDATION_ERROR' });
      }

      const allocationId = `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await conn.query(
        `INSERT INTO warehouse_allocations (id, deal_id, warehouse_id, warehouse_name, product_id, quantity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [allocationId, dealId, warehouseId, warehouseName, productId, requestedQuantity, status]
      );

      if (status === 'ALLOCATED' || status === 'PARTIAL') {
        await conn.query(
          `UPDATE inventory
          SET reserved_quantity = reserved_quantity + ?
           WHERE warehouse_id = ? AND product_id = ?`,
          [requestedQuantity, warehouseId, productId]
        );
      }

      insertedRows.push({ id: allocationId, warehouseId, warehouseName, productId, quantity: requestedQuantity, status });
    }

    const allFullyAllocated = allocations.every((a) => a.status === 'ALLOCATED');
    const currentStatus = deals[0].status;
    let newStatus = currentStatus;

    if (allFullyAllocated && VALID_TRANSITIONS[currentStatus]?.includes(DealStatus.FULFILLMENT_PENDING)) {
      newStatus = DealStatus.FULFILLMENT_PENDING;
      await conn.query('UPDATE deals SET status = ? WHERE id = ?', [newStatus, dealId]);
    }

    await logEvent(
      dealId,
      DealEventType.WAREHOUSE_ALLOCATED,
      req.user.id,
      `Warehouse allocation recorded for deal ${dealId} (${allocations.length} line${allocations.length > 1 ? 's' : ''}).`,
      { allocations },
      conn
    );

    await conn.commit();
    conn.release();

    res.json({ success: true, data: { dealId, status: newStatus, allocations: insertedRows } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    const code = err.code === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(code).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
