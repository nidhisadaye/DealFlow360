const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');
const router = express.Router();

const serializeProduct = (product) => ({
  ...product,
  sale_price: Number(product.sale_price || 0),
  cost_price: Number(product.cost_price || 0),
});

router.get('/', authenticate, authorize(UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json({ success: true, data: rows.map(serializeProduct), meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/:id', authenticate, authorize(UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }
    res.json({ success: true, data: serializeProduct(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.post('/', authenticate, authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      category,
      type,
      billing_type,
      sale_price,
      cost_price,
      currency,
    } = req.body;

    if (
      !id ||
      !name ||
      !category ||
      !type ||
      !billing_type ||
      sale_price === undefined ||
      cost_price === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id, name, category, type, billing_type, sale_price and cost_price are required.',
        },
      });
    }

    await pool.query(
      `INSERT INTO products
       (id, name, description, category, type, billing_type, sale_price, cost_price, currency, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        id,
        name,
        description || null,
        category,
        type,
        billing_type,
        sale_price,
        cost_price,
        currency || 'INR',
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        name,
        description: description || null,
        category,
        type,
        billing_type,
        sale_price,
        cost_price,
        currency: currency || 'INR',
        is_active: true,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  }
});

module.exports = router;