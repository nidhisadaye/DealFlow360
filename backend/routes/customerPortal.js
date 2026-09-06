const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');

const router = express.Router();

router.get('/overview', authenticate, authorize(UserRole.CUSTOMER), async (req, res) => {
  try {
    const [customers] = await pool.query(
      'SELECT id, name, company, email, tier FROM customers WHERE LOWER(email) = LOWER(?) AND is_active = TRUE LIMIT 1',
      [req.user.email]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No customer profile is linked to this account.' },
      });
    }

    const customer = customers[0];
    const [deals] = await pool.query(
      `SELECT id, title, status, discount_percent, total_amount, margin_percent, risk_level, created_at, updated_at
       FROM deals WHERE customer_id = ? ORDER BY updated_at DESC`,
      [customer.id]
    );

    const [negotiations] = await pool.query(
      `SELECT n.id, n.deal_id, n.description, n.proposed_discount_percent, n.note, n.status, n.created_at
       FROM negotiations n JOIN deals d ON d.id = n.deal_id
       WHERE d.customer_id = ? ORDER BY n.created_at DESC`,
      [customer.id]
    );

    res.json({
      success: true,
      data: {
        customer,
        deals,
        negotiations,
        counts: {
          deals: deals.length,
          openNegotiations: negotiations.filter((item) => item.status === 'OPEN').length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

module.exports = router;
