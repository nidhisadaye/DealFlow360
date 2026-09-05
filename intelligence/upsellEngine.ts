import {
  Deal,
  Product,
  UpsellRecommendation,
} from "../shared/types";

/**
 * A single upsell rule: when a deal contains an active item whose product
 * category matches `sourceCategory`, look for an active candidate product
 * whose name contains one of `targetNameKeywords` and recommend it.
 *
 * `confidence` is a fixed, deterministic value describing how strong the
 * relationship is:
 * - 0.9  = direct product relationship (the primary upsell for the category)
 * - 0.75 = category-based relationship (a secondary/related upsell)
 *
 * This structure is intentionally data-driven so the rule set can later be
 * moved into backend configuration without changing the engine logic.
 */
export interface UpsellRule {
  sourceCategory: string;
  targetNameKeywords: string[];
  reason: string;
  confidence: number;
}

const DEFAULT_UPSELL_RULES: UpsellRule[] = [
  {
    sourceCategory: "Hardware",
    targetNameKeywords: ["extended warranty"],
    reason: "Recommended protection for hardware purchase.",
    confidence: 0.9,
  },
  {
    sourceCategory: "Hardware",
    targetNameKeywords: ["maintenance service"],
    reason: "Recommended maintenance service for hardware.",
    confidence: 0.75,
  },
  {
    sourceCategory: "Software",
    targetNameKeywords: ["implementation service"],
    reason: "Recommended implementation support for software.",
    confidence: 0.9,
  },
  {
    sourceCategory: "Software",
    targetNameKeywords: ["support service"],
    reason: "Recommended support coverage for software.",
    confidence: 0.75,
  },
];

const UPSELL_QUANTITY = 1;

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase();
}

function calculateMarginImpactPercent(candidate: Product): number {
  if (candidate.salePrice <= 0) {
    return 0;
  }

  const margin = candidate.salePrice - candidate.costPrice;

  return (margin / candidate.salePrice) * 100;
}

function matchesTargetName(
  candidate: Product,
  targetNameKeywords: string[]
): boolean {
  const candidateName = candidate.name.toLowerCase();

  return targetNameKeywords.some((keyword) =>
    candidateName.includes(keyword.toLowerCase())
  );
}

function buildRecommendation(
  candidate: Product,
  rule: UpsellRule
): UpsellRecommendation {
  const revenueImpact = candidate.salePrice * UPSELL_QUANTITY;
  const marginImpactPercent = calculateMarginImpactPercent(candidate);

  return {
    productId: candidate.id,
    productName: candidate.name,
    reason: rule.reason,
    quantity: UPSELL_QUANTITY,
    revenueImpact,
    marginImpactPercent,
    confidence: rule.confidence,
  };
}

export function generateUpsellRecommendations(
  deal: Deal,
  products: Product[],
  rules: UpsellRule[] = DEFAULT_UPSELL_RULES
): UpsellRecommendation[] {
  const productsById = new Map<string, Product>(
    products.map((product) => [product.id, product])
  );

  const dealProductIds = new Set(
    deal.items.map((item) => item.productId)
  );

  const dealCategories = new Set<string>();

  for (const item of deal.items) {
    const product = productsById.get(item.productId);

    if (product) {
      dealCategories.add(normalizeCategory(product.category));
    }
  }

  const recommendations: UpsellRecommendation[] = [];
  const recommendedProductIds = new Set<string>();

  for (const rule of rules) {
    if (!dealCategories.has(normalizeCategory(rule.sourceCategory))) {
      continue;
    }

    for (const candidate of products) {
      if (!candidate.isActive) {
        continue;
      }

      if (dealProductIds.has(candidate.id)) {
        continue;
      }

      if (recommendedProductIds.has(candidate.id)) {
        continue;
      }

      if (!matchesTargetName(candidate, rule.targetNameKeywords)) {
        continue;
      }

      recommendations.push(buildRecommendation(candidate, rule));
      recommendedProductIds.add(candidate.id);
    }
  }

  return recommendations;
}