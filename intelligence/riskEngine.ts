import {
  Deal,
  Inventory,
  RiskLevel,
} from "../shared/types";

import { DiscountEvaluation } from "./discountEngine";

export interface RiskEvaluation {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: {
    discountRisk: number;
    marginRisk: number;
    inventoryRisk: number;
  };
  warnings: string[];
}

const DISCOUNT_RISK_MAX = 40;
const MARGIN_RISK_MAX = 40;
const INVENTORY_RISK_MAX = 20;

/**
 * Clamps a numeric risk contribution into [0, max] and guards against NaN /
 * +Infinity / -Infinity ever propagating into the final risk score. This is
 * the single choke point all risk math flows through before being summed,
 * so a bad upstream value (corrupted discount/margin data, division by
 * zero elsewhere, etc.) can never surface as NaN/Infinity in the public
 * contract — it is deterministically treated as the maximum risk for that
 * factor, since an unknown/invalid signal is the conservative (safe) choice
 * for a governance engine.
 */
function sanitizeRiskContribution(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return max;
  }

  return Math.min(Math.max(value, 0), max);
}

function computeDiscountRisk(
  discountEvaluation: DiscountEvaluation
): number {
  if (!discountEvaluation.exceeded) {
    return 0;
  }

  const risk = discountEvaluation.excessPercent * 8;

  return sanitizeRiskContribution(risk, DISCOUNT_RISK_MAX);
}

function computeMarginRisk(marginPercent: number): number {
  if (!Number.isFinite(marginPercent)) {
    // Unknown/invalid margin is treated as the worst case: we cannot prove
    // the deal is safe, so we do not default to zero risk.
    return MARGIN_RISK_MAX;
  }

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

  return MARGIN_RISK_MAX;
}

/**
 * Sums available inventory for a product, defensively clamping any
 * individual record's contribution to zero or above (mirrors the same
 * defensive handling warehouseEngine already applies), so a bad/negative
 * inventory record can never make a product look *more* available than it
 * actually is, nor drag the running total negative.
 */
function getAvailableQuantity(
  inventory: Inventory[],
  productId: string
): number {
  return inventory
    .filter((record) => record.productId === productId)
    .reduce((sum, record) => sum + Math.max(record.availableQuantity, 0), 0);
}

function computeInventoryRisk(
  deal: Deal,
  inventory: Inventory[]
): number {
  let inventoryRisk = 0;

  for (const item of deal.items) {
    // Nothing is actually being fulfilled for a non-positive quantity, so
    // there is nothing to be "at risk" of not fulfilling. This mirrors
    // warehouseEngine's own treatment of requiredQuantity <= 0.
    if (item.quantity <= 0) {
      continue;
    }

    const totalAvailable = getAvailableQuantity(inventory, item.productId);

    if (totalAvailable === 0) {
      inventoryRisk += 20;
    } else if (totalAvailable < item.quantity) {
      inventoryRisk += 15;
    }
  }

  return sanitizeRiskContribution(inventoryRisk, INVENTORY_RISK_MAX);
}

function computeRiskLevel(riskScore: number): RiskLevel {
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

function buildWarnings(
  discountEvaluation: DiscountEvaluation,
  marginPercent: number,
  discountRisk: number,
  marginRisk: number,
  inventoryRisk: number
): string[] {
  const warnings: string[] = [];

  if (discountRisk > 0) {
    warnings.push(
      "Requested discount exceeds configured limits."
    );

    if (discountRisk >= DISCOUNT_RISK_MAX) {
      warnings.push(
        "Requested discount is far beyond the approved threshold."
      );
    }
  }

  if (!Number.isFinite(marginPercent)) {
    warnings.push(
      "Deal margin could not be determined; treated as highest risk."
    );
  } else if (marginPercent <= 0) {
    warnings.push(
      "Deal margin is negative."
    );
  } else if (marginRisk >= 25) {
    warnings.push(
      "Deal margin is relatively low."
    );
  }

  if (inventoryRisk > 0) {
    warnings.push(
      "Inventory may not fully support the requested quantity."
    );
  }

  return warnings;
}

export function evaluateRisk(
  deal: Deal,
  discountEvaluation: DiscountEvaluation,
  inventory: Inventory[]
): RiskEvaluation {
  const discountRisk = computeDiscountRisk(discountEvaluation);
  const marginRisk = computeMarginRisk(deal.marginPercent);
  const inventoryRisk = computeInventoryRisk(deal, inventory);

  const warnings = buildWarnings(
    discountEvaluation,
    deal.marginPercent,
    discountRisk,
    marginRisk,
    inventoryRisk
  );

  const riskScore = Math.min(
    Math.round(discountRisk + marginRisk + inventoryRisk),
    100
  );

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