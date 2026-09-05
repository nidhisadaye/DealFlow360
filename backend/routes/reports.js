const express = require('express');
const PDFDocument = require('pdfkit');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../config/enums');
const pool = require('../config/db');

const router = express.Router();
const reportRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPERATIONS, UserRole.ADMIN];

function money(value, currency = 'INR') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function addHeading(doc, text) {
  doc.moveDown(0.35);
  doc.fontSize(17).font('Helvetica-Bold').fillColor('#1f4788').text(text);
  doc.moveDown(0.2);
  doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
}

function addSubheading(doc, text) {
  doc.moveDown(0.2);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#2e5c8a').text(text);
  doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
}

function addBullet(doc, text) {
  doc.text(`- ${text}`, { indent: 10, lineGap: 2 });
}

function addMetric(doc, label, value) {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(String(value));
}

function buildFilters(query) {
  const conditions = [];
  const values = [];

  if (query.from) {
    conditions.push('d.created_at >= ?');
    values.push(query.from);
  }

  if (query.to) {
    conditions.push('d.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    values.push(query.to);
  }

  if (query.salesRepId) {
    conditions.push('d.sales_rep_id = ?');
    values.push(query.salesRepId);
  }

  if (query.approvalStatus) {
    conditions.push('d.status = ?');
    values.push(query.approvalStatus);
  }

  if (query.productId) {
    conditions.push('EXISTS (SELECT 1 FROM deal_items filter_items WHERE filter_items.deal_id = d.id AND filter_items.product_id = ?)');
    values.push(query.productId);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

async function loadReportData(query) {
  const filters = buildFilters(query);
  const [summaryRows] = await pool.query(
    `SELECT
       COUNT(*) AS deal_count,
       COALESCE(SUM(d.subtotal), 0) AS subtotal,
       COALESCE(SUM(d.discount_amount), 0) AS discount_amount,
       COALESCE(SUM(d.total_amount), 0) AS revenue,
       COALESCE(SUM(d.cost_amount), 0) AS cost_amount,
       COALESCE(SUM(d.margin_amount), 0) AS profit,
       COALESCE(AVG(d.discount_percent), 0) AS average_discount_percent,
       COALESCE(AVG(d.margin_percent), 0) AS average_margin_percent,
       COALESCE(AVG(d.risk_score), 0) AS average_risk_score,
       SUM(d.status = 'CLOSED') AS closed_count,
       SUM(d.status = 'APPROVED') AS approved_count,
       SUM(d.status IN ('APPROVAL_REQUIRED', 'REAPPROVAL_REQUIRED')) AS pending_approval_count,
       SUM(d.status = 'REJECTED') AS rejected_count,
      SUM(d.status IN ('DRAFT', 'UNDER_REVIEW', 'NEGOTIATION', 'FULFILLMENT_PENDING', 'READY_TO_BILL')) AS active_count,
      SUM(d.margin_amount > 0) AS profitable_count,
      SUM(d.margin_amount <= 0) AS loss_making_count,
      SUM(d.risk_level IN ('HIGH', 'CRITICAL')) AS high_risk_count
     FROM deals d ${filters.clause}`,
    filters.values
  );

  const [statusRows] = await pool.query(
    `SELECT d.status, COUNT(*) AS deal_count, COALESCE(SUM(d.total_amount), 0) AS revenue,
            COALESCE(SUM(d.margin_amount), 0) AS profit
     FROM deals d ${filters.clause}
     GROUP BY d.status
     ORDER BY deal_count DESC`,
    filters.values
  );

  const [repRows] = await pool.query(
    `SELECT u.name AS sales_rep, COUNT(*) AS deal_count,
            COALESCE(SUM(d.discount_amount), 0) AS discount_amount,
            COALESCE(SUM(d.total_amount), 0) AS revenue,
            COALESCE(SUM(d.margin_amount), 0) AS profit,
            COALESCE(AVG(d.margin_percent), 0) AS margin_percent
     FROM deals d
     JOIN users u ON u.id = d.sales_rep_id
     ${filters.clause}
     GROUP BY d.sales_rep_id, u.name
     ORDER BY profit DESC`,
    filters.values
  );

  const [productRows] = await pool.query(
    `SELECT di.product_name, SUM(di.quantity) AS quantity,
            COALESCE(SUM(di.subtotal - di.total), 0) AS discount_amount,
            COALESCE(SUM(di.total), 0) AS revenue,
            COALESCE(SUM((di.unit_price - di.unit_cost) * di.quantity - (di.subtotal - di.total)), 0) AS profit
     FROM deal_items di
     JOIN deals d ON d.id = di.deal_id
     ${filters.clause}
     GROUP BY di.product_id, di.product_name
     ORDER BY revenue DESC
     LIMIT 10`,
    filters.values
  );

  return {
    summary: summaryRows[0],
    statuses: statusRows,
    salesReps: repRows,
    products: productRows,
    filters: query,
  };
}

function addReportHeader(doc, title) {
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#12305b').text('DealFlow360', { align: 'center' });
  doc.fontSize(16).font('Helvetica').fillColor('#000000').text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#666666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(0.8);
  doc.fontSize(10).fillColor('#000000');
}

function addFooter(doc) {
  const pages = doc.bufferedPageRange();
  for (let page = 0; page < pages.count; page += 1) {
    doc.switchToPage(page);
    doc.fontSize(8).fillColor('#777777').text(`DealFlow360 | Page ${page + 1} of ${pages.count}`, 50, 760, { align: 'center', width: 500 });
  }
}

function addBusinessReport(doc, report) {
  const summary = report.summary;
  const currency = 'INR';

  addReportHeader(doc, 'Overall Business Performance Report');
  doc.text('This report shows the current performance of the DealFlow360 application using real deal data from the database. It explains how much was quoted, discounted, earned as revenue and generated as profit.');
  addSubheading(doc, 'Report scope');
  addMetric(doc, 'Period from', report.filters.from || 'All available dates');
  addMetric(doc, 'Period to', report.filters.to || 'All available dates');
  addMetric(doc, 'Sales representative filter', report.filters.salesRepId || 'All representatives');
  addMetric(doc, 'Status filter', report.filters.approvalStatus || 'All statuses');
  addMetric(doc, 'Product filter', report.filters.productId || 'All products');

  addHeading(doc, '1. Overall Deal Performance');
  addMetric(doc, 'Total deals', summary.deal_count);
  addMetric(doc, 'Original quotation value', money(summary.subtotal, currency));
  addMetric(doc, 'Total discount given', money(summary.discount_amount, currency));
  addMetric(doc, 'Revenue after discount', money(summary.revenue, currency));
  addMetric(doc, 'Total product/service cost', money(summary.cost_amount, currency));
  addMetric(doc, 'Total profit generated', money(summary.profit, currency));
  addMetric(doc, 'Average discount', `${Number(summary.average_discount_percent || 0).toFixed(2)}%`);
  addMetric(doc, 'Average profit margin', `${Number(summary.average_margin_percent || 0).toFixed(2)}%`);
  addMetric(doc, 'Average risk score', Number(summary.average_risk_score || 0).toFixed(2));
  addMetric(doc, 'Closed deals', summary.closed_count || 0);
  addMetric(doc, 'Approved deals', summary.approved_count || 0);
  addMetric(doc, 'Deals waiting for approval', summary.pending_approval_count || 0);
  addMetric(doc, 'Rejected deals', summary.rejected_count || 0);
  addMetric(doc, 'Active deals', summary.active_count || 0);
  addMetric(doc, 'Profitable deals', summary.profitable_count || 0);
  addMetric(doc, 'Loss-making deals', summary.loss_making_count || 0);
  addMetric(doc, 'High or critical risk deals', summary.high_risk_count || 0);
  doc.moveDown(0.4);
  doc.text('Profit is calculated from the stored margin amount: revenue after discount minus product/service cost. This allows the team to see whether discounts are helping conversion without damaging profitability.');

  addHeading(doc, '2. DealFlow360 Application Flow');
  const flow = [
    '1. Internal users such as Sales Representatives, Sales Managers, Finance Operations and Admin register or log in.',
    '2. A Sales Representative creates a deal for a customer and adds products or services.',
    '3. The Representative applies a discount and the backend calculates subtotal, discount amount, final revenue, cost and profit margin.',
    '4. The system evaluates the deal status, risk information and approval requirement.',
    '5. A Sales Manager or Finance user handles deals that need approval.',
    '6. Approved deals can move toward warehouse allocation, fulfillment and billing.',
    '7. One-time and recurring products can create invoice and subscription records.',
    '8. Negotiation records can be saved against a deal and the deal can return to an approval stage when required.',
    '9. Events are recorded so the team can understand what happened during the deal lifecycle.',
    '10. This report summarizes the business result: discount, revenue, cost, profit, risk and deal status.'
  ];
  flow.forEach((step) => doc.text(step, { lineGap: 2 }));
  doc.addPage();

  addReportHeader(doc, 'DealFlow360 Business Performance Report');
  addHeading(doc, '3. Intelligent Deal Evaluation');
  doc.text('DealFlow360 stores the numbers needed to make a commercial decision instead of looking only at the final selling price. The backend compares the original value, discount, revenue and cost so the team can identify profitable, low-margin and risky deals.');
  addBullet(doc, `Discount intelligence: ${money(summary.discount_amount, currency)} has been given across the selected deals.`);
  addBullet(doc, `Profit intelligence: ${money(summary.profit, currency)} is the calculated total margin after product/service costs.`);
  addBullet(doc, `Margin intelligence: the average margin is ${Number(summary.average_margin_percent || 0).toFixed(2)}%.`);
  addBullet(doc, `Risk intelligence: the average stored risk score is ${Number(summary.average_risk_score || 0).toFixed(2)}.`);
  addBullet(doc, 'Approval intelligence: deals with approval-required statuses are counted separately for management attention.');
  addBullet(doc, 'The frontend can use these same values for dashboard cards, warnings and charts.');

  addSubheading(doc, 'Deal status performance');
  report.statuses.forEach((row) => {
    doc.font('Helvetica-Bold').text(`${row.status}: `, { continued: true });
    doc.font('Helvetica').text(`${row.deal_count} deals | Revenue ${money(row.revenue, currency)} | Profit ${money(row.profit, currency)}`);
  });

  addHeading(doc, '4. Performance by Sales Representative');
  if (report.salesReps.length === 0) {
    doc.text('No deal data is available for the selected filters.');
  } else {
    report.salesReps.forEach((row) => {
      doc.font('Helvetica-Bold').text(`${row.sales_rep}: `, { continued: true });
      doc.font('Helvetica').text(`${row.deal_count} deals | Discount ${money(row.discount_amount, currency)} | Revenue ${money(row.revenue, currency)} | Profit ${money(row.profit, currency)} | Margin ${Number(row.margin_percent || 0).toFixed(2)}%`);
    });
  }
  doc.addPage();

  addReportHeader(doc, 'DealFlow360 Product and Technical Report');
  addHeading(doc, '5. Product Performance');
  if (report.products.length === 0) {
    doc.text('No product data is available for the selected filters.');
  } else {
    report.products.forEach((row) => {
      doc.font('Helvetica-Bold').text(`${row.product_name}: `, { continued: true });
      doc.font('Helvetica').text(`Quantity ${row.quantity} | Discount ${money(row.discount_amount, currency)} | Revenue ${money(row.revenue, currency)} | Profit ${money(row.profit, currency)}`);
    });
  }

  addHeading(doc, '6. Backend Technology Behind the Report');
  addBullet(doc, 'Node.js runs the backend JavaScript and handles database requests asynchronously.');
  addBullet(doc, 'Express.js exposes protected REST APIs for login, deals, approvals, inventory, billing, negotiations and reporting.');
  addBullet(doc, 'MySQL stores users, customers, products, deals, line items, costs, discounts, approvals and audit events.');
  addBullet(doc, 'Transactions protect multi-step deal creation and related event logging.');
  addBullet(doc, 'JWT and role-based authorization ensure that business reports are available only to permitted internal roles.');
  addBullet(doc, 'PDFKit generates this downloadable report from live database values.');

  addHeading(doc, '7. Data Included in the Report');
  addBullet(doc, 'Deal count and lifecycle status counts.');
  addBullet(doc, 'Original quotation value, discount amount and final revenue.');
  addBullet(doc, 'Cost amount, profit amount and profit margin percentage.');
  addBullet(doc, 'Risk score and approval-related counts.');
  addBullet(doc, 'Sales representative performance.');
  addBullet(doc, 'Product quantity, revenue, discount and profit.');
  addBullet(doc, 'Optional date, representative, status and product filters.');

  doc.moveDown(1);
  doc.fontSize(9).fillColor('#666666').text('Generated by DealFlow360 from current database records. If there are no deals yet, monetary totals will correctly appear as zero.', { align: 'center', width: 500 });
}

async function sendReport(req, res) {
  try {
    const report = await loadReportData(req.query || {});
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=DealFlow360_Business_Report.pdf');
    doc.pipe(res);
    addBusinessReport(doc, report);
    addFooter(doc);
    doc.end();
  } catch (error) {
    console.error('Error generating business report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_GENERATION_ERROR', message: 'Failed to generate business report.' }
    });
  }
}

async function sendSummary(req, res) {
  try {
    const report = await loadReportData(req.query || {});
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error loading report summary:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_SUMMARY_ERROR', message: 'Failed to load business report summary.' }
    });
  }
}

router.get('/summary', authenticate, authorize(...reportRoles), sendSummary);
router.get(['/download', '/'], authenticate, authorize(...reportRoles), sendReport);

module.exports = router;
