const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { DealStatus, DealEventType, VALID_TRANSITIONS } = require('../config/enums');
const logEvent = require('../utils/logEvent');

const router = express.Router();

// GET /api/warehouses — list active warehouses
router.get('/warehouses', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM warehouses WHERE is_active = TRUE ORDER BY name');
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
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
              i.available_quantity AS availableQuantity, i.reserved_quantity AS reservedQuantity,
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

      if (!warehouseId || !warehouseName || !productId || !quantity || !status) {
        throw Object.assign(
          new Error('Each allocation needs warehouseId, warehouseName, productId, quantity, and status.'),
          { code: 'VALIDATION_ERROR' }
        );
      }

      const allocationId = `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await conn.query(
        `INSERT INTO warehouse_allocations (id, deal_id, warehouse_id, warehouse_name, product_id, quantity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [allocationId, dealId, warehouseId, warehouseName, productId, quantity, status]
      );

      if (status === 'ALLOCATED' || status === 'PARTIAL') {
        await conn.query(
          `UPDATE inventory
           SET reserved_quantity = GREATEST(0, reserved_quantity - ?)
           WHERE warehouse_id = ? AND product_id = ?`,
          [quantity, warehouseId, productId]
        );
      }

      insertedRows.push({ id: allocationId, warehouseId, warehouseName, productId, quantity, status });
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