"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineApproval = determineApproval;
function isHighRisk(riskLevel) {
    return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}
function determineApproval(discountEvaluation, riskEvaluation, marginPercent) {
    const reasons = [];
    if (!discountEvaluation || typeof discountEvaluation.exceeded !== "boolean") {
        reasons.push("Discount evaluation is unavailable, so approval is required as a precaution.");
    }
    else if (discountEvaluation.exceeded) {
        reasons.push("Discount exceeds configured customer tier limit.");
    }
    if (!riskEvaluation || !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(riskEvaluation.riskLevel)) {
        reasons.push("Deal risk level could not be determined, so approval is required as a precaution.");
    }
    else if (isHighRisk(riskEvaluation.riskLevel)) {
        reasons.push(`Deal risk is ${riskEvaluation.riskLevel.toLowerCase()}, which requires approval.`);
    }
    if (marginPercent !== null && marginPercent !== undefined) {
        if (!Number.isFinite(marginPercent)) {
            reasons.push("Deal margin could not be determined, so approval is required as a precaution.");
        }
        else if (marginPercent <= 0) {
            reasons.push("Deal margin is zero or negative, which requires approval.");
        }
    }
    if (reasons.length > 0) {
        return { required: true, reason: reasons.join(" ") };
    }
    return {
        required: false,
        reason: "Deal does not require approval.",
    };
}
