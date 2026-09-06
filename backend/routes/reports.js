const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');

const router = express.Router();
const reportRoles = [UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN];
const toNumber = (value) => Number(value || 0);
const money = (value) => `INR ${toNumber(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function buildFilters(query) {
  const conditions = [];
  const values = [];
  if (query.from) { conditions.push('d.created_at >= ?'); values.push(query.from); }
  if (query.to) { conditions.push('d.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); values.push(query.to); }
  if (query.salesRepId) { conditions.push('d.sales_rep_id = ?'); values.push(query.salesRepId); }
  if (query.status) { conditions.push('d.status = ?'); values.push(query.status); }
  if (query.productId) {
    conditions.push('EXISTS (SELECT 1 FROM deal_items filter_items WHERE filter_items.deal_id = d.id AND filter_items.product_id = ?)');
    values.push(query.productId);
  }
  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

async function loadReportData(query) {
  const filters = buildFilters(query);
  const [[summary]] = await pool.query(`
    SELECT COUNT(*) AS total_deals,
      COALESCE(SUM(d.subtotal), 0) AS quotation_value,
      COALESCE(SUM(d.discount_amount), 0) AS total_discount,
      COALESCE(SUM(d.total_amount), 0) AS revenue,
      COALESCE(SUM(d.cost_amount), 0) AS total_cost,
      COALESCE(SUM(d.margin_amount), 0) AS total_profit,
      COALESCE(AVG(d.discount_percent), 0) AS average_discount,
      COALESCE(AVG(d.margin_percent), 0) AS average_margin,
      COALESCE(AVG(d.risk_score), 0) AS average_risk,
      COALESCE(SUM(d.status IN ('APPROVAL_REQUIRED', 'REAPPROVAL_REQUIRED')), 0) AS pending_approvals,
      COALESCE(SUM(d.status = 'CLOSED'), 0) AS closed_deals,
      COALESCE(SUM(d.risk_level IN ('HIGH', 'CRITICAL')), 0) AS high_risk_deals,
      COALESCE(SUM(d.margin_amount > 0), 0) AS profitable_deals
    FROM deals d ${filters.clause}`, filters.values);
  const [statuses] = await pool.query(`
    SELECT d.status, COUNT(*) AS deal_count, COALESCE(SUM(d.total_amount), 0) AS revenue,
      COALESCE(SUM(d.margin_amount), 0) AS profit
    FROM deals d ${filters.clause} GROUP BY d.status ORDER BY deal_count DESC`, filters.values);
  const [salesReps] = await pool.query(`
    SELECT u.name AS sales_rep, COUNT(*) AS deal_count,
      COALESCE(SUM(d.discount_amount), 0) AS discount,
      COALESCE(SUM(d.total_amount), 0) AS revenue,
      COALESCE(SUM(d.margin_amount), 0) AS profit
    FROM deals d JOIN users u ON u.id = d.sales_rep_id ${filters.clause}
    GROUP BY u.id, u.name ORDER BY profit DESC`, filters.values);
  return {
    summary: Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, toNumber(value)])),
    statuses,
    salesReps,
    filters: query,
  };
}

function heading(doc, text) {
  doc.moveDown(0.5).fontSize(16).font('Helvetica-Bold').fillColor('#1f4788').text(text);
  doc.moveDown(0.15).fontSize(10).font('Helvetica').fillColor('#000000');
}

function metric(doc, label, value) {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(String(value));
}

async function downloadReport(req, res) {
  try {
    const report = await loadReportData(req.query || {});
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=DealFlow360_Business_Report.pdf');
    doc.pipe(res);
    doc.fontSize(25).font('Helvetica-Bold').fillColor('#12305b').text('DealFlow360', { align: 'center' });
    doc.fontSize(15).font('Helvetica').fillColor('#000000').text('Business Performance Report', { align: 'center' });
    doc.fontSize(9).fillColor('#666666').text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
    heading(doc, 'Overall Performance');
    metric(doc, 'Total deals', report.summary.total_deals);
    metric(doc, 'Original quotation value', money(report.summary.quotation_value));
    metric(doc, 'Total discount given', money(report.summary.total_discount));
    metric(doc, 'Revenue after discount', money(report.summary.revenue));
    metric(doc, 'Total cost', money(report.summary.total_cost));
    metric(doc, 'Total profit generated', money(report.summary.total_profit));
    metric(doc, 'Average discount', `${report.summary.average_discount.toFixed(2)}%`);
    metric(doc, 'Average profit margin', `${report.summary.average_margin.toFixed(2)}%`);
    metric(doc, 'Average risk score', report.summary.average_risk.toFixed(2));
    metric(doc, 'Pending approvals', report.summary.pending_approvals);
    metric(doc, 'Closed deals', report.summary.closed_deals);
    metric(doc, 'High-risk deals', report.summary.high_risk_deals);
    metric(doc, 'Profitable deals', report.summary.profitable_deals);
    heading(doc, 'Deal Status Performance');
    report.statuses.forEach((row) => doc.text(`${row.status}: ${row.deal_count} deals | Revenue ${money(row.revenue)} | Profit ${money(row.profit)}`));
    heading(doc, 'Sales Representative Performance');
    report.salesReps.forEach((row) => doc.text(`${row.sales_rep}: ${row.deal_count} deals | Discount ${money(row.discount)} | Revenue ${money(row.revenue)} | Profit ${money(row.profit)}`));
    heading(doc, 'Technology');
    doc.text('Node.js and Express.js provide the API, MySQL stores live business data, JWT protects access, bcrypt protects passwords, and PDFKit generates this report.');
    doc.end();
  } catch (error) {
    console.error('Business report error:', error);
    res.status(500).json({ success: false, error: { code: 'REPORT_GENERATION_ERROR', message: 'Unable to generate report.' } });
  }
}

async function summary(req, res) {
  try {
    res.json({ success: true, data: await loadReportData(req.query || {}) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'REPORT_SUMMARY_ERROR', message: 'Unable to load report summary.' } });
  }
}

router.get('/summary', authenticate, authorize(...reportRoles), summary);
router.get(['/download', '/'], authenticate, authorize(...reportRoles), downloadReport);
module.exports = router;
