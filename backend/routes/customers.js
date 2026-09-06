const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');
const router = express.Router();
const internalRoles = [UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN];

router.get('/', authenticate, authorize(UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers');
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/:id', authenticate, authorize(UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.post('/', authenticate, authorize(...internalRoles), async (req, res) => {
  try {
    const { name, company, email, phone, tier = 'BRONZE', creditLimit } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !company || !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name, company and a valid email are required.' } });
    }
    const id = `CUS-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      'INSERT INTO customers (id, name, company, email, phone, tier, credit_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
      [id, String(name).trim(), String(company).trim(), normalizedEmail, phone || null, tier, creditLimit || null]
    );
    res.status(201).json({ success: true, data: { id, name: String(name).trim(), company: String(company).trim(), email: normalizedEmail, phone: phone || null, tier, credit_limit: creditLimit || null, is_active: true } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, error: { code: 'DUPLICATE_REQUEST', message: 'A customer with this email already exists.' } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;