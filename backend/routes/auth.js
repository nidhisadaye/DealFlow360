const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { UserRole } = require('../config/enums');
const { authenticate, revokeToken } = require('../middleware/auth');

const router = express.Router();

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

// POST /api/auth/signup  — internal users only (Sales Rep, Manager, Finance, Admin)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, email, password, and role are required.' },
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' },
      });
    }

    if (!Object.values(UserRole).includes(role) || role === UserRole.CUSTOMER) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid role for internal signup.' },
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_REQUEST', message: 'A user with this email already exists.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = `USR-${Date.now()}`;

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, normalizedEmail, passwordHash, role]
    );

    res.json({ success: true, data: { id, name, email: normalizedEmail, role } });
  } catch (err) {
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_REQUEST', message: 'A user with this email already exists.' },
      });
    }

    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/auth/login — internal users
router.post('/login', async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const { password } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' },
      });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/auth/logout — invalidates token on server side
router.post('/logout', authenticate, (req, res) => {
  revokeToken(req.token);

  return res.json({
    success: true,
    data: { message: 'Logged out successfully.' },
  });
});

// POST /api/auth/portal-login — customer portal (simple email+password for now, magic link is a P2 nice-to-have)
router.post('/portal-login', async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const { password } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' },
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = ?',
      [email, UserRole.CUSTOMER]
    );
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email } } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;