"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateDeal = evaluateDeal;
const discountEngine_1 = require("./discountEngine");
const riskEngine_1 = require("./riskEngine");
const approvalEngine_1 = require("./approvalEngine");
const warehouseEngine_1 = require("./warehouseEngine");
const upsellEngine_1 = require("./upsellEngine");
/**
 * Merge warnings from the discount and risk engines.
 *
 * The intelligence engines remain responsible for producing their
 * own explanations. dealEngine only combines them.
 */
function mergeWarnings(discountReasons, riskEvaluation) {
    const messages = [];
    if (Array.isArray(discountReasons)) {
        messages.push(...discountReasons);
    }
    if (Array.isArray(riskEvaluation.warnings)) {
        messages.push(...riskEvaluation.warnings);
    }
    // Remove duplicate warnings while preserving deterministic order.
    return Array.from(new Set(messages));
}
/**
 * Determines whether warehouse fulfillment is complete for the deal.
 *
 * Important orchestration rules:
 *
 * - Only valid positive deal quantities create fulfillment requirements.
 * - Invalid, zero, negative, NaN, and Infinity quantities are ignored.
 * - Multiple deal items for the same product are aggregated.
 * - Multiple warehouse allocations for the same product are aggregated.
 * - PARTIAL or UNAVAILABLE allocation means fulfillment is incomplete.
 * - Missing allocation for a required product means fulfillment is incomplete.
 * - Allocated quantity must meet the total required quantity.
 * - Empty/invalid deal items are treated as having no fulfillment
 *   requirement.
 *
 * This function does NOT perform inventory allocation itself.
 * warehouseEngine remains the single source of truth for allocation.
 * dealEngine only determines whether the allocation result is complete.
 */
function isFulfillmentComplete(deal, warehouseAllocation) {
    const items = Array.isArray(deal.items)
        ? deal.items
        : [];
    const allocations = Array.isArray(warehouseAllocation)
        ? warehouseAllocation
        : [];
    /**
     * Aggregate required quantity by product.
     *
     * This is important because a deal can theoretically contain
     * multiple line items for the same product.
     */
    const requiredByProduct = new Map();
    for (const item of items) {
        if (!item) {
            continue;
        }
        const productId = typeof item.productId === "string"
            ? item.productId.trim()
            : "";
        const quantity = Number(item.quantity);
        /**
         * Invalid/zero/negative quantities do not create a fulfillment
         * requirement. This matches warehouseEngine's safe handling.
         */
        if (!productId ||
            !Number.isFinite(quantity) ||
            quantity <= 0) {
            continue;
        }
        const currentRequired = requiredByProduct.get(productId) ?? 0;
        requiredByProduct.set(productId, currentRequired + quantity);
    }
    /**
     * A deal with no valid positive-quantity items has nothing
     * that needs warehouse fulfillment.
     */
    if (requiredByProduct.size === 0) {
        return true;
    }
    /**
     * Aggregate actual allocated quantity by product.
     */
    const allocatedByProduct = new Map();
    /**
     * Track whether any allocation for a product is explicitly
     * incomplete.
     */
    const incompleteByProduct = new Set();
    for (const allocation of allocations) {
        if (!allocation) {
            continue;
        }
        const productId = typeof allocation.productId === "string"
            ? allocation.productId.trim()
            : "";
        if (!productId) {
            continue;
        }
        /**
         * PARTIAL and UNAVAILABLE are explicit signals from
         * warehouseEngine that the product is not completely fulfilled.
         */
        if (allocation.status === "PARTIAL" ||
            allocation.status === "UNAVAILABLE") {
            incompleteByProduct.add(productId);
        }
        /**
         * Only finite positive quantities count toward fulfillment.
         *
         * Negative quantities are treated as zero.
         * NaN/Infinity are ignored.
         */
        const quantity = Number(allocation.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            continue;
        }
        const currentAllocated = allocatedByProduct.get(productId) ?? 0;
        allocatedByProduct.set(productId, currentAllocated + quantity);
    }
    /**
     * Every required product must independently be fully fulfilled.
     */
    for (const [productId, requiredQuantity,] of requiredByProduct.entries()) {
        /**
         * No allocation at all for a required product means
         * fulfillment is incomplete.
         */
        if (!allocatedByProduct.has(productId)) {
            return false;
        }
        /**
         * Any explicit PARTIAL/UNAVAILABLE allocation means
         * fulfillment is incomplete.
         */
        if (incompleteByProduct.has(productId)) {
            return false;
        }
        const allocatedQuantity = allocatedByProduct.get(productId) ?? 0;
        /**
         * Do not consider the product fulfilled until the complete
         * required quantity has been allocated.
         */
        if (allocatedQuantity < requiredQuantity) {
            return false;
        }
    }
    return true;
}
/**
 * Determines the deal's current lifecycle status.
 *
 * Status precedence is intentionally deterministic:
 *
 * 1. Approval is required
 *      -> APPROVAL_REQUIRED
 *
 * 2. Approval is not required, but fulfillment is incomplete
 *      -> FULFILLMENT_PENDING
 *
 * 3. Approval is not required and fulfillment is complete
 *      -> APPROVED
 *
 * Approval takes precedence over fulfillment because a deal that
 * still requires commercial approval cannot be considered ready
 * merely because inventory exists.
 *
 * Risk does NOT directly determine status here. The approval engine
 * already consumes the risk evaluation and determines whether
 * approval is required.
 */
function determineStatus(approval, deal, warehouseAllocation) {
    /**
     * Highest priority:
     * commercial approval is still required.
     */
    if (approval.required) {
        return "APPROVAL_REQUIRED";
    }
    /**
     * Approval is not required, so fulfillment becomes the next
     * gating condition.
     */
    if (!isFulfillmentComplete(deal, warehouseAllocation)) {
        return "FULFILLMENT_PENDING";
    }
    /**
     * No approval required and all required inventory is fulfilled.
     */
    return "APPROVED";
}
/**
 * Main DealFlow360 intelligence orchestrator.
 *
 * This is the single source of truth for deal evaluation.
 *
 * Responsibilities:
 * - Run discount evaluation
 * - Run risk evaluation
 * - Determine approval
 * - Generate upsell recommendations
 * - Allocate warehouse inventory
 * - Determine lifecycle status from cross-engine results
 * - Merge public warnings
 *
 * This function deliberately does NOT:
 * - Access the database
 * - Perform SQL queries
 * - Persist anything
 * - Duplicate discount/risk/approval/warehouse/upsell rules
 * - Perform ML predictions
 * - Mutate input objects
 */
function evaluateDeal(deal, customer, products, rules, inventory, warehouses, upsellRules) {
    /**
     * ---------------------------------------------------------------
     * 1. DISCOUNT EVALUATION
     * ---------------------------------------------------------------
     *
     * discountEngine remains responsible for:
     * - applicable rules
     * - allowed discount
     * - exceeded discount
     * - excess percentage
     * - discount-related explanations
     */
    const { evaluation: discountEvaluation, reasons: discountReasons, } = (0, discountEngine_1.evaluateDiscount)(deal, customer, products, rules);
    /**
     * ---------------------------------------------------------------
     * 2. RISK EVALUATION
     * ---------------------------------------------------------------
     *
     * riskEngine consumes the discount evaluation instead of
     * recalculating discount rules itself.
     */
    const riskEvaluation = (0, riskEngine_1.evaluateRisk)(deal, discountEvaluation, inventory);
    /**
     * ---------------------------------------------------------------
     * 3. APPROVAL EVALUATION
     * ---------------------------------------------------------------
     *
     * approvalEngine consumes discount + risk outputs.
     *
     * dealEngine does not duplicate approval logic.
     */
    const approvalDecision = (0, approvalEngine_1.determineApproval)(discountEvaluation, riskEvaluation, deal.marginPercent);
    /**
     * ---------------------------------------------------------------
     * 4. UPSELL EVALUATION
     * ---------------------------------------------------------------
     */
    const upsells = (0, upsellEngine_1.generateUpsellRecommendations)(deal, products, upsellRules);
    /**
     * ---------------------------------------------------------------
     * 5. WAREHOUSE FULFILLMENT
     * ---------------------------------------------------------------
     *
     * warehouseEngine remains responsible for actual allocation.
     */
    const warehouseAllocation = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    /**
     * ---------------------------------------------------------------
     * 6. CROSS-ENGINE STATUS ORCHESTRATION
     * ---------------------------------------------------------------
     *
     * Status is calculated only after both approval and fulfillment
     * results are available.
     */
    const status = determineStatus(approvalDecision, deal, warehouseAllocation);
    /**
     * ---------------------------------------------------------------
     * 7. WARNING MERGE
     * ---------------------------------------------------------------
     */
    const warnings = mergeWarnings(discountReasons, riskEvaluation);
    /**
     * ---------------------------------------------------------------
     * 8. PUBLIC EVALUATION
     * ---------------------------------------------------------------
     *
     * Keep the public contract stable.
     *
     * Do not expose internal diagnostic fields such as:
     * - approvalRequired
     * - reasons
     * - requestedDiscount
     * - allowedDiscount
     * - approverRole
     */
    return {
        dealId: deal.id,
        status,
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        marginPercent: deal.marginPercent,
        discount: discountEvaluation,
        approval: approvalDecision,
        upsells,
        warehouseAllocation,
        warnings,
    };
}
