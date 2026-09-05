import { DiscountEvaluation } from "./discountEngine";
import { RiskEvaluation } from "./riskEngine";

export interface ApprovalDecision {
  required: boolean;
  reason: string;
}

function isHighRisk(
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
): boolean {
  return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}

export function determineApproval(
  discountEvaluation: DiscountEvaluation,
  riskEvaluation: RiskEvaluation
): ApprovalDecision {
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