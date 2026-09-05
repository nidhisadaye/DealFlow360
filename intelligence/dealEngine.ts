import {
  Customer,
  Deal,
  DealStatus,
  DiscountRule,
  Inventory,
  Product,
  RiskLevel,
  UpsellRecommendation,
  WarehouseAllocation,
} from "../shared/types";

import { DiscountEvaluation, evaluateDiscount } from "./discountEngine";
import { RiskEvaluation, evaluateRisk } from "./riskEngine";
import { ApprovalDecision, determineApproval } from "./approvalEngine";

export interface DealEvaluation {
  dealId: string;
  status: DealStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  marginPercent: number;
  discount: DiscountEvaluation;
  approval: ApprovalDecision;
  upsells: UpsellRecommendation[];
  warehouseAllocation: WarehouseAllocation[];
  warnings: string[];
}

function mergeWarnings(
  discountEvaluation: DiscountEvaluation,
  riskEvaluation: RiskEvaluation
): string[] {
  const combined = [
    ...discountEvaluation.reasons,
    ...riskEvaluation.warnings,
  ];

  return Array.from(new Set(combined));
}

function determineStatus(
  approval: ApprovalDecision
): DealStatus {
  return approval.required ? "APPROVAL_REQUIRED" : "APPROVED";
}

export function evaluateDeal(
  deal: Deal,
  customer: Customer,
  products: Product[],
  rules: DiscountRule[],
  inventory: Inventory[]
): DealEvaluation {
  const discountEvaluation = evaluateDiscount(
    deal,
    customer,
    products,
    rules
  );

  const riskEvaluation = evaluateRisk(
    deal,
    discountEvaluation,
    inventory
  );

  const approvalDecision = determineApproval(
    discountEvaluation,
    riskEvaluation
  );

  const status = determineStatus(approvalDecision);

  const warnings = mergeWarnings(discountEvaluation, riskEvaluation);

  return {
    dealId: deal.id,
    status,
    riskScore: riskEvaluation.riskScore,
    riskLevel: riskEvaluation.riskLevel,
    marginPercent: deal.marginPercent,
    discount: discountEvaluation,
    approval: approvalDecision,
    upsells: [],
    warehouseAllocation: [],
    warnings,
  };
}