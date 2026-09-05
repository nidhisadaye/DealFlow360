const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole, DealStatus, ApprovalStatus } = require('../config/enums');
const logEvent = require('../utils/logEvent');

const router = express.Router();

// GET /api/approvals — list all approval requests
router.get('/approvals', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM approval_requests ORDER BY created_at DESC');
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/approve — Sales Manager (or Finance) approves a deal
router.post('/deals/:id/approve', authenticate, authorize(UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { comments } = req.body || {};

    const [deals] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (deals.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }
    if (deals[0].status !== DealStatus.APPROVAL_REQUIRED && deals[0].status !== DealStatus.REAPPROVAL_REQUIRED) {
      conn.release();
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Deal is not awaiting approval.' } });
    }

    await conn.beginTransaction();

    await conn.query('UPDATE deals SET status = ? WHERE id = ?', [DealStatus.APPROVED, dealId]);

    const [pending] = await conn.query(
      "SELECT * FROM approval_requests WHERE deal_id = ? AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1",
      [dealId]
    );
    if (pending.length > 0) {
      await conn.query(
        'UPDATE approval_requests SET status = ?, comments = ? WHERE id = ?',
        [ApprovalStatus.APPROVED, comments || null, pending[0].id]
      );
    }

    await logEvent(dealId, 'APPROVED', req.user.id, `Deal approved by ${req.user.role}.`, { comments }, conn);

    await conn.commit();
    conn.release();

    res.json({ success: true, data: { id: dealId, status: DealStatus.APPROVED } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/reject
router.post('/deals/:id/reject', authenticate, authorize(UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { reason } = req.body || {};

    const [deals] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (deals.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } });
    }

    await conn.beginTransaction();

    await conn.query('UPDATE deals SET status = ? WHERE id = ?', [DealStatus.REJECTED, dealId]);

    const [pending] = await conn.query(
      "SELECT * FROM approval_requests WHERE deal_id = ? AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1",
      [dealId]
    );
    if (pending.length > 0) {
      await conn.query(
        'UPDATE approval_requests SET status = ?, comments = ? WHERE id = ?',
        [ApprovalStatus.REJECTED, reason || null, pending[0].id]
      );
    }

    await logEvent(dealId, 'REJECTED', req.user.id, `Deal rejected by ${req.user.role}: ${reason || 'no reason given'}.`, { reason }, conn);

    await conn.commit();
    conn.release();

    res.json({ success: true, data: { id: dealId, status: DealStatus.REJECTED } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/deals/:id/events — audit timeline
router.get('/deals/:id/events', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM deal_events WHERE deal_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, data: rows, meta: { total: rows.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;