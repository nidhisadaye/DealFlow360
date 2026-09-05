import {
  Customer,
  Deal,
  DealStatus,
  DiscountRule,
  Inventory,
  Product,
  RiskLevel,
  UpsellRecommendation,
  Warehouse,
  WarehouseAllocation,
} from "../shared/types";

import { DiscountEvaluation, evaluateDiscount } from "./discountEngine";
import { RiskEvaluation, evaluateRisk } from "./riskEngine";
import { ApprovalDecision, determineApproval } from "./approvalEngine";
import { allocateWarehouseInventory } from "./warehouseEngine";
import { UpsellRule, generateUpsellRecommendations } from "./upsellEngine";

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
  discountReasons: string[],
  riskEvaluation: RiskEvaluation
): string[] {
  const messages: string[] = [];

  messages.push(...discountReasons);
  messages.push(...riskEvaluation.warnings);

  return Array.from(new Set(messages));
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
  inventory: Inventory[],
  warehouses: Warehouse[],
  upsellRules?: UpsellRule[]
): DealEvaluation {
  const { evaluation: discountEvaluation, reasons: discountReasons } =
    evaluateDiscount(deal, customer, products, rules);

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

  const warnings = mergeWarnings(discountReasons, riskEvaluation);

  const upsells = generateUpsellRecommendations(deal, products, upsellRules);

  const warehouseAllocation = allocateWarehouseInventory(
    deal,
    inventory,
    warehouses
  );

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