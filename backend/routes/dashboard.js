const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');

const router = express.Router();
const internalRoles = [UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN];
const toNumber = (value) => Number(value || 0);

router.get('/summary', authenticate, authorize(...internalRoles), async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COALESCE(SUM(d.status NOT IN ('CLOSED', 'REJECTED')), 0) AS active_deals,
        COALESCE(SUM(CASE WHEN d.status NOT IN ('CLOSED', 'REJECTED') THEN d.total_amount ELSE 0 END), 0) AS pipeline_value,
        COALESCE(SUM(d.status IN ('APPROVAL_REQUIRED', 'REAPPROVAL_REQUIRED')), 0) AS pending_approvals,
        COALESCE(SUM(d.risk_level IN ('HIGH', 'CRITICAL')), 0) AS at_risk_deals
      FROM deals d
    `);

    const [healthRows] = await pool.query(`
      SELECT
        COALESCE(SUM(d.status NOT IN ('CLOSED', 'REJECTED') AND d.risk_level IN ('LOW', 'MEDIUM')), 0) AS on_track,
        COALESCE(SUM(d.status NOT IN ('CLOSED', 'REJECTED') AND d.risk_level = 'HIGH'), 0) AS at_risk,
        COALESCE(SUM(d.status NOT IN ('CLOSED', 'REJECTED') AND d.risk_level = 'CRITICAL'), 0) AS stalled
      FROM deals d
    `);

    const [alerts] = await pool.query(`
      SELECT ar.id, ar.deal_id, ar.reason, ar.risk_score, ar.created_at,
             d.title AS deal_title, c.name AS customer_name
      FROM approval_requests ar
      JOIN deals d ON d.id = ar.deal_id
      JOIN customers c ON c.id = d.customer_id
      WHERE ar.status = 'PENDING'
      ORDER BY ar.created_at DESC
      LIMIT 5
    `);

    const [recentDeals] = await pool.query(`
      SELECT d.id, d.title, d.status, d.total_amount, d.risk_level, d.updated_at,
             c.name AS customer_name, u.name AS owner_name
      FROM deals d
      JOIN customers c ON c.id = d.customer_id
      JOIN users u ON u.id = d.sales_rep_id
      ORDER BY d.updated_at DESC
      LIMIT 5
    `);

    const data = {
      metrics: {
        activeDeals: toNumber(summary.active_deals),
        pipelineValue: toNumber(summary.pipeline_value),
        pendingApprovals: toNumber(summary.pending_approvals),
        atRiskDeals: toNumber(summary.at_risk_deals),
      },
      health: Object.fromEntries(Object.entries(healthRows[0]).map(([key, value]) => [key, toNumber(value)])),
      alerts,
      recentDeals: recentDeals.map((deal) => ({ ...deal, total_amount: toNumber(deal.total_amount) })),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, error: { code: 'DASHBOARD_ERROR', message: 'Unable to load dashboard data.' } });
  }
});

module.exports = router;
