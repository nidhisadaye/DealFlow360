"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineApproval = determineApproval;
function isHighRisk(riskLevel) {
    return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}
function determineApproval(discountEvaluation, riskEvaluation) {
    if (discountEvaluation.exceeded) {
        return {
            required: true,
            reason: "Discount exceeds configured customer tier limit.",
        };
    }
    if (isHighRisk(riskEvaluation.riskLevel)) {
        return {
            required: true,
            reason: `Deal risk is ${riskEvaluation.riskLevel.toLowerCase()}, which requires approval.`,
        };
    }
    return {
        required: false,
        reason: "Deal does not require approval.",
    };
}
