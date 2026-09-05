const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { DealStatus, DealEventType } = require('../config/enums');
const logEvent = require('../utils/logEvent');

const router = express.Router();

// GET /api/deals/:id/negotiations
router.get('/deals/:id/negotiations', authenticate, async (req, res) => {
  try {
    const dealId = req.params.id;

    const [dealRows] = await pool.query('SELECT id FROM deals WHERE id = ?', [dealId]);
    if (dealRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Deal not found.' },
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM negotiations WHERE deal_id = ? ORDER BY created_at DESC',
      [dealId]
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: rows.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/deals/:id/negotiate
router.post('/deals/:id/negotiate', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dealId = req.params.id;
    const { description, proposedDiscountPercent, note } = req.body || {};

    if (!description || !String(description).trim()) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'description is required.' },
      });
    }

    const [dealRows] = await conn.query('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (dealRows.length === 0) {
      conn.release();
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Deal not found.' },
      });
    }

    const cleanedDescription = String(description).trim();

    await conn.beginTransaction();

    const negotiationId = `NEG-${Date.now()}`;

    await conn.query(
      `INSERT INTO negotiations (id, deal_id, actor_id, description, proposed_discount_percent, note, status)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        negotiationId,
        dealId,
        req.user.id,
        cleanedDescription,
        proposedDiscountPercent === undefined || proposedDiscountPercent === null ? null : Number(proposedDiscountPercent),
        note ? String(note).trim() : null,
      ]
    );

    await conn.query('UPDATE deals SET status = ? WHERE id = ?', [DealStatus.NEGOTIATION, dealId]);

    await logEvent(
      dealId,
      DealEventType.NEGOTIATION_STARTED,
      req.user.id,
      `Negotiation started for deal ${dealId}.`,
      { negotiationId, description: cleanedDescription, proposedDiscountPercent },
      conn
    );

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      data: {
        id: negotiationId,
        dealId,
        description: cleanedDescription,
        proposedDiscountPercent:
          proposedDiscountPercent === undefined || proposedDiscountPercent === null ? null : Number(proposedDiscountPercent),
        note: note ? String(note).trim() : null,
        status: 'OPEN',
      },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
