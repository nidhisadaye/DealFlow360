const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const logEvent = require("../utils/logEvent");
const { DealEventType } = require("../config/enums");
const { getDiscountRules } = require("../config/discountrules");

const { evaluateDeal } = require("../../intelligence/dealEngine");

// ---------------------------------------------------------------------------
// Mapping helpers
// DB snake_case -> Intelligence camelCase
// ---------------------------------------------------------------------------

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone || undefined,
    tier: row.tier,
    creditLimit:
      row.credit_limit === null || row.credit_limit === undefined
        ? undefined
        : toNumber(row.credit_limit),
    isActive: !!row.is_active,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category,
    type: row.type,
    billingType: row.billing_type,
    salePrice: toNumber(row.sale_price),
    costPrice: toNumber(row.cost_price),
    currency: row.currency,
    isActive: !!row.is_active,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  };
}

function mapWarehouse(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    isActive: !!row.is_active,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  };
}

function mapInventory(row) {
  const availableQuantity = toNumber(row.available_quantity);
  const reservedQuantity = toNumber(row.reserved_quantity);

  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    productId: row.product_id,
    // The intelligence layer receives sellable stock, not physical stock.
    availableQuantity: Math.max(availableQuantity - reservedQuantity, 0),
    reservedQuantity,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

function mapDealItem(row) {
  return {
    id: row.id,
    dealId: row.deal_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    unitCost: toNumber(row.unit_cost),
    billingType: row.billing_type,
    recurringInterval: row.recurring_interval || undefined,
    discountPercent: toNumber(row.discount_percent),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
  };
}

function mapDeal(dealRow, itemRows) {
  return {
    id: dealRow.id,
    customerId: dealRow.customer_id,
    salesRepId: dealRow.sales_rep_id,
    title: dealRow.title,
    status: dealRow.status,
    items: itemRows.map(mapDealItem),
    discountPercent: toNumber(dealRow.discount_percent),
    subtotal: toNumber(dealRow.subtotal),
    discountAmount: toNumber(dealRow.discount_amount),
    totalAmount: toNumber(dealRow.total_amount),
    costAmount: toNumber(dealRow.cost_amount),
    marginAmount: toNumber(dealRow.margin_amount),
    marginPercent: toNumber(dealRow.margin_percent),
    riskScore: toNumber(dealRow.risk_score),
    riskLevel: dealRow.risk_level,
    currency: dealRow.currency,

    createdAt:
      dealRow.created_at instanceof Date
        ? dealRow.created_at.toISOString()
        : dealRow.created_at,

    updatedAt:
      dealRow.updated_at instanceof Date
        ? dealRow.updated_at.toISOString()
        : dealRow.updated_at,
  };
}

function notFound(message) {
  const err = new Error(message);
  err.httpStatus = 404;
  err.code = "NOT_FOUND";
  return err;
}

function toPublicEvaluation(evaluation) {
  return {
    ...evaluation,
    discount: {
      requested: evaluation.discount.requested,
      allowed: evaluation.discount.allowed,
      exceeded: evaluation.discount.exceeded,
      excessPercent: evaluation.discount.excessPercent,
    },
  };
}

// ---------------------------------------------------------------------------
// POST /api/deals/:id/evaluate
// ---------------------------------------------------------------------------

const evaluateDealRoute = async (req, res) => {
  const dealId = req.params.id;

  try {
    // ---------------------------------------------------------------
    // 1. Fetch deal
    // ---------------------------------------------------------------

    const [dealRows] = await db.query(
      "SELECT * FROM deals WHERE id = ?",
      [dealId]
    );

    const dealRow = dealRows[0];

    if (!dealRow) {
      throw notFound("Deal not found.");
    }

    // ---------------------------------------------------------------
    // 2. Fetch deal items
    // ---------------------------------------------------------------

    const [itemRows] = await db.query(
      "SELECT * FROM deal_items WHERE deal_id = ?",
      [dealId]
    );

    // ---------------------------------------------------------------
    // 3. Fetch customer
    // ---------------------------------------------------------------

    const [customerRows] = await db.query(
      "SELECT * FROM customers WHERE id = ?",
      [dealRow.customer_id]
    );

    const customerRow = customerRows[0];

    if (!customerRow) {
      throw notFound("Customer not found for this deal.");
    }

    // ---------------------------------------------------------------
    // 4. Fetch the active product catalog for discount and upsell evaluation
    // ---------------------------------------------------------------

    const productIds = [
      ...new Set(itemRows.map((item) => item.product_id)),
    ];

    const [productRows] = await db.query(
      "SELECT * FROM products WHERE is_active = TRUE"
    );

    // ---------------------------------------------------------------
    // 5. Fetch inventory
    // ---------------------------------------------------------------

    let inventoryRows = [];

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(", ");

      const [rows] = await db.query(
        `SELECT *
         FROM inventory
         WHERE product_id IN (${placeholders})`,
        productIds
      );

      inventoryRows = rows;
    }

    // ---------------------------------------------------------------
    // 6. Fetch warehouses
    // ---------------------------------------------------------------

    const [warehouseRows] = await db.query(
      `SELECT w.*, COALESCE(dw.is_active, w.is_active) AS scoped_is_active
       FROM warehouses w
       LEFT JOIN deal_warehouses dw
         ON dw.warehouse_id = w.id AND dw.deal_id = ?
       WHERE dw.deal_id IS NOT NULL OR w.is_active = TRUE`,
      [dealId]
    );

    // ---------------------------------------------------------------
    // 7. Map DB data into intelligence types
    // ---------------------------------------------------------------

    const deal = mapDeal(dealRow, itemRows);
    const customer = mapCustomer(customerRow);
    const products = productRows.map(mapProduct);
    const inventory = inventoryRows.map(mapInventory);
    const warehouses = warehouseRows.map((row) => ({
      ...mapWarehouse(row),
      isActive: !!row.scoped_is_active,
    }));

    // Discount rules are loaded from the same schema as the deal data.
    const [ruleRows] = await db.query(
      `SELECT id, name, customer_tier AS customerTier,
              product_category AS productCategory,
              max_discount_percent AS maxDiscountPercent,
              requires_approval_above AS requiresApprovalAbove,
              is_active AS isActive,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM discount_rules
       WHERE is_active = TRUE`
    );
    const databaseRules = ruleRows.map((rule) => ({
      ...rule,
      maxDiscountPercent: toNumber(rule.maxDiscountPercent),
      requiresApprovalAbove: toNumber(rule.requiresApprovalAbove),
      isActive: !!rule.isActive,
    }));
    // A clean development database may not yet contain policy rows. Keep the
    // intelligence path usable with the shared, versioned baseline rules.
    const rules = databaseRules.length > 0 ? databaseRules : getDiscountRules();

    const [upsellRuleRows] = await db.query(
      `SELECT source_category AS sourceCategory,
              target_name_keywords AS targetNameKeywords,
              reason,
              confidence
       FROM upsell_rules
      WHERE is_active = TRUE
      ORDER BY confidence DESC, id`
    );
    const databaseUpsellRules = upsellRuleRows.map((rule) => ({
      ...rule,
      targetNameKeywords:
        typeof rule.targetNameKeywords === "string"
          ? JSON.parse(rule.targetNameKeywords)
          : rule.targetNameKeywords,
      confidence: toNumber(rule.confidence),
    }));
    // `undefined` deliberately lets the engine use its baseline rules.
    const upsellRules = databaseUpsellRules.length > 0 ? databaseUpsellRules : undefined;

    // ---------------------------------------------------------------
    // 8. Run existing intelligence engine
    // ---------------------------------------------------------------

    const evaluation = evaluateDeal(
      deal,
      customer,
      products,
      rules,
      inventory,
      warehouses,
      upsellRules
    );

    await db.query(
      `UPDATE deals
       SET status = ?,
           risk_score = ?,
           risk_level = ?,
           margin_percent = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        evaluation.status,
        evaluation.riskScore,
        evaluation.riskLevel,
        evaluation.marginPercent,
        deal.id,
      ]
    );

    if (evaluation.approval.required) {
      const [pendingApprovals] = await db.query(
        "SELECT id FROM approval_requests WHERE deal_id = ? AND status = 'PENDING' LIMIT 1",
        [deal.id]
      );

      if (pendingApprovals.length === 0) {
        await db.query(
          `INSERT INTO approval_requests
             (id, deal_id, requested_by, approver_role, status, reason,
              requested_discount_percent, allowed_discount_percent, risk_score)
           VALUES (?, ?, ?, 'SALES_MANAGER', 'PENDING', ?, ?, ?, ?)`,
          [
            `APR-${Date.now()}${Math.floor(Math.random() * 1000)}`,
            deal.id,
            req.user.id,
            evaluation.approval.reason,
            evaluation.discount.requested,
            evaluation.discount.allowed,
            evaluation.riskScore,
          ]
        );
      }
    } else {
      await db.query(
        `UPDATE approval_requests
         SET status = 'REJECTED',
             comments = 'Superseded by a re-evaluation that no longer requires approval.'
         WHERE deal_id = ? AND status = 'PENDING'`,
        [deal.id]
      );
    }

    // ---------------------------------------------------------------
    // 9. Log evaluation event
    // ---------------------------------------------------------------

    try {
      await logEvent(
        deal.id,
        DealEventType.EVALUATION_COMPLETED,
        req.user.id,
        `Deal ${deal.id} evaluated: ${evaluation.status}.`,
        {
          riskScore: evaluation.riskScore,
          riskLevel: evaluation.riskLevel,
          approvalRequired: evaluation.approval.required,
        }
      );

      if (evaluation.upsells.length > 0) {
        await logEvent(
          deal.id,
          DealEventType.UPSELL_ADDED,
          req.user.id,
          `${evaluation.upsells.length} upsell recommendation(s) generated.`,
          { recommendations: evaluation.upsells }
        );
      }

      if (evaluation.warehouseAllocation.length > 0) {
        await logEvent(
          deal.id,
          DealEventType.WAREHOUSE_ALLOCATED,
          req.user.id,
          "Warehouse allocation calculated.",
          { allocations: evaluation.warehouseAllocation }
        );
      }
    } catch (logErr) {
      // Logging failure must not break evaluation response.
      console.error(
        "logEvent failed for EVALUATION_COMPLETED:",
        logErr
      );
    }

    // ---------------------------------------------------------------
    // 10. Return exact evaluation contract
    // ---------------------------------------------------------------

    return res.json({
      success: true,
      data: toPublicEvaluation(evaluation),
    });
  } catch (err) {
    // ---------------------------------------------------------------
    // 404 handling
    // ---------------------------------------------------------------

    if (err.httpStatus === 404) {
      return res.status(404).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }

    // ---------------------------------------------------------------
    // Unexpected error
    // ---------------------------------------------------------------

    console.error(
      "POST /api/deals/:id/evaluate failed:",
      err
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "EVALUATION_FAILED",
        message: "Failed to evaluate deal.",
      },
    });
  }
};

router.post("/deals/:id/evaluate", authenticate, evaluateDealRoute);

module.exports = router;
