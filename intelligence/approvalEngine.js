"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineApproval = determineApproval;
const KNOWN_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
function isKnownRiskLevel(value) {
    return (typeof value === "string" &&
        KNOWN_RISK_LEVELS.includes(value));
}
function isHighOrCriticalRisk(riskLevel) {
    return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}
/**
 * Discount-governance trigger.
 *
 * Consumes discountEngine's own `exceeded` verdict — it does not
 * re-derive an allowed discount or re-match customer/category rules.
 *
 * Conservative-by-default: if the discount evaluation is missing, or its
 * `exceeded` flag is not a real boolean (malformed/incomplete upstream
 * output), approval is required rather than silently skipped. An unknown
 * discount posture is never treated as "safe".
 */
function evaluateDiscountTrigger(discountEvaluation) {
    if (!discountEvaluation) {
        return {
            reason: "Discount evaluation is unavailable, so approval is required as a precaution.",
        };
    }
    if (typeof discountEvaluation.exceeded !== "boolean") {
        return {
            reason: "Discount evaluation result is incomplete, so approval is required as a precaution.",
        };
    }
    if (discountEvaluation.exceeded) {
        return { reason: "Discount exceeds configured customer tier limit." };
    }
    return null;
}
/**
 * Risk trigger. Consumes riskEngine's own riskLevel — it does not
 * re-score risk. Preserves the existing HIGH/CRITICAL → approval-required
 * policy and the existing thresholds owned by riskEngine
 * (LOW 0-29, MEDIUM 30-59, HIGH 60-79, CRITICAL 80-100).
 *
 * Conservative-by-default: a missing evaluation or an unrecognized
 * riskLevel value is never treated as low/safe risk.
 */
function evaluateRiskTrigger(riskEvaluation) {
    if (!riskEvaluation) {
        return {
            reason: "Risk evaluation is unavailable, so approval is required as a precaution.",
        };
    }
    if (!isKnownRiskLevel(riskEvaluation.riskLevel)) {
        return {
            reason: "Deal risk level could not be determined, so approval is required as a precaution.",
        };
    }
    if (isHighOrCriticalRisk(riskEvaluation.riskLevel)) {
        return {
            reason: `Deal risk is ${riskEvaluation.riskLevel.toLowerCase()}, which requires approval.`,
        };
    }
    return null;
}
/**
 * Margin trigger. `marginPercent` is optional and purely additive: callers
 * that don't supply it (matching the pre-Phase-3 signature) get exactly
 * the pre-Phase-3 discount/risk-only behavior. When it *is* supplied,
 * a non-finite value (NaN/Infinity/-Infinity from corrupted upstream data)
 * or a non-positive margin (breakeven or a loss) requires approval — the
 * same conservative posture riskEngine already applies to margin risk.
 */
function evaluateMarginTrigger(marginPercent) {
    if (marginPercent === null || marginPercent === undefined) {
        return null;
    }
    if (!Number.isFinite(marginPercent)) {
        return {
            reason: "Deal margin could not be determined, so approval is required as a precaution.",
        };
    }
    if (marginPercent <= 0) {
        return {
            reason: "Deal margin is zero or negative, which requires approval.",
        };
    }
    return null;
}
/**
 * Determines whether a deal requires approval.
 *
 * This engine only answers "is approval required?" — it does not create
 * approval requests, assign approvers, persist state, or notify anyone.
 * It is a pure function of its inputs: nothing is cached, so re-evaluating
 * the same deal after its discount/risk/margin change always reflects the
 * current inputs only.
 *
 * Approval is required if ANY authoritative trigger fires (discount
 * governance, risk level, or margin). A safe condition never cancels an
 * unsafe one — every trigger is evaluated independently and their results
 * are OR'ed together, so e.g. a safe discount cannot mask critical risk.
 *
 * `marginPercent` is optional so existing call sites that only have
 * discount + risk evaluations keep working unchanged.
 */
function determineApproval(discountEvaluation, riskEvaluation, marginPercent) {
    const triggers = [];
    const discountTrigger = evaluateDiscountTrigger(discountEvaluation);
    if (discountTrigger) {
        triggers.push(discountTrigger);
    }
    const riskTrigger = evaluateRiskTrigger(riskEvaluation);
    if (riskTrigger) {
        triggers.push(riskTrigger);
    }
    const marginTrigger = evaluateMarginTrigger(marginPercent);
    if (marginTrigger) {
        triggers.push(marginTrigger);
    }
    if (triggers.length > 0) {
        return {
            required: true,
            reason: triggers.map((trigger) => trigger.reason).join(" "),
        };
    }
    return {
        required: false,
        reason: "Deal does not require approval.",
    };
}
