"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateDeal = evaluateDeal;
const discountEngine_1 = require("./discountEngine");
const riskEngine_1 = require("./riskEngine");
const approvalEngine_1 = require("./approvalEngine");
const upsellEngine_1 = require("./upsellEngine");
const warehouseEngine_1 = require("./warehouseEngine");
function mergeWarnings(discountReasons, riskEvaluation) {
    const messages = [];
    messages.push(...discountReasons);
    messages.push(...riskEvaluation.warnings);
    return Array.from(new Set(messages));
}
function determineStatus(approval) {
    return approval.required ? "APPROVAL_REQUIRED" : "APPROVED";
}
function evaluateDeal(deal, customer, products, rules, inventory, warehouses, upsellRules) {
    const { evaluation: discountEvaluation, reasons: discountReasons } = (0, discountEngine_1.evaluateDiscount)(deal, customer, products, rules);
    const riskEvaluation = (0, riskEngine_1.evaluateRisk)(deal, discountEvaluation, inventory);
    const approvalDecision = (0, approvalEngine_1.determineApproval)(discountEvaluation, riskEvaluation, deal.marginPercent);
    const status = determineStatus(approvalDecision);
    const warnings = mergeWarnings(discountReasons, riskEvaluation);
    const upsells = (0, upsellEngine_1.generateUpsellRecommendations)(deal, products, upsellRules);
    const warehouseAllocation = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
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
