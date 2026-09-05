"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRisk = evaluateRisk;
function computeDiscountRisk(discountEvaluation) {
    if (!discountEvaluation.exceeded) {
        return 0;
    }
    const risk = discountEvaluation.excessPercent * 8;
    return Math.min(risk, 40);
}
function computeMarginRisk(marginPercent) {
    if (marginPercent >= 30) {
        return 0;
    }
    if (marginPercent >= 20) {
        return 10;
    }
    if (marginPercent >= 10) {
        return 25;
    }
    if (marginPercent > 0) {
        return 35;
    }
    return 40;
}
function computeInventoryRisk(deal, inventory) {
    let inventoryRisk = 0;
    for (const item of deal.items) {
        const matchingInventory = inventory.filter((record) => record.productId === item.productId);
        const totalAvailable = matchingInventory.reduce((sum, record) => sum + record.availableQuantity, 0);
        if (totalAvailable === 0) {
            inventoryRisk += 20;
        }
        else if (totalAvailable < item.quantity) {
            inventoryRisk += 15;
        }
    }
    return Math.min(inventoryRisk, 20);
}
function computeRiskLevel(riskScore) {
    if (riskScore >= 80) {
        return "CRITICAL";
    }
    if (riskScore >= 60) {
        return "HIGH";
    }
    if (riskScore >= 30) {
        return "MEDIUM";
    }
    return "LOW";
}
function evaluateRisk(deal, discountEvaluation, inventory) {
    const warnings = [];
    const discountRisk = computeDiscountRisk(discountEvaluation);
    const marginRisk = computeMarginRisk(deal.marginPercent);
    const inventoryRisk = computeInventoryRisk(deal, inventory);
    if (discountRisk > 0) {
        warnings.push("Requested discount exceeds configured limits.");
    }
    if (marginRisk >= 25) {
        warnings.push("Deal margin is relatively low.");
    }
    if (inventoryRisk > 0) {
        warnings.push("Inventory may not fully support the requested quantity.");
    }
    const riskScore = Math.min(Math.round(discountRisk + marginRisk + inventoryRisk), 100);
    const riskLevel = computeRiskLevel(riskScore);
    return {
        riskScore,
        riskLevel,
        factors: {
            discountRisk,
            marginRisk,
            inventoryRisk,
        },
        warnings,
    };
}
