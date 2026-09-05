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
 * `isActive` is optional and additive (Phase 4): omitting it preserves the
 * pre-Phase-4 behavior of always treating a rule as active, so the
 * DEFAULT_UPSELL_RULES below — and any existing caller-supplied rule sets
 * that don't set it — are unaffected. Set it to `false` to disable a rule
 * without removing it from the rule set.
 *
 * This structure is intentionally data-driven so the rule set can later be
 * moved into backend configuration without changing the engine logic.
 */
export interface UpsellRule {
  sourceCategory: string;
  targetNameKeywords: string[];
  reason: string;
  confidence: number;
  isActive?: boolean;
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

function normalizeCategory(category: string | null | undefined): string {
  if (typeof category !== "string") {
    return "";
  }

  return category.trim().toLowerCase();
}

/**
 * A rule only participates if it is active. Absence of `isActive` (the
 * pre-Phase-4 shape) is treated as active, matching prior behavior.
 */
function isRuleActive(rule: UpsellRule): boolean {
  return rule.isActive !== false;
}

/**
 * Margin impact as a percentage of sale price. Never returns NaN/Infinity:
 * an unusable sale price (non-finite, zero, or negative) or an unusable
 * cost price (non-finite) deterministically yields 0 — a neutral,
 * explainable fallback — rather than propagating corrupted upstream data
 * into the recommendation.
 */
function calculateMarginImpactPercent(candidate: Product): number {
  const salePrice = candidate.salePrice;
  const costPrice = candidate.costPrice;

  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return 0;
  }

  if (!Number.isFinite(costPrice)) {
    return 0;
  }

  const margin = salePrice - costPrice;
  const marginImpactPercent = (margin / salePrice) * 100;

  return Number.isFinite(marginImpactPercent) ? marginImpactPercent : 0;
}

/**
 * Revenue impact for recommending `quantity` units of `candidate`. Never
 * returns NaN/Infinity: an unusable sale price (non-finite or negative)
 * deterministically yields 0 rather than propagating bad data.
 */
function calculateRevenueImpact(candidate: Product, quantity: number): number {
  const salePrice = candidate.salePrice;

  if (!Number.isFinite(salePrice) || salePrice < 0) {
    return 0;
  }

  const revenue = salePrice * quantity;

  return Number.isFinite(revenue) ? revenue : 0;
}

/**
 * A rule's `confidence` is a fixed, rule-authored number (never
 * ML-derived). This only guards against a malformed/out-of-range value
 * making it into the public contract — it does not change any of the
 * DEFAULT_UPSELL_RULES values, which are already valid.
 */
function sanitizeConfidence(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(Math.max(confidence, 0), 1);
}

function matchesTargetName(
  candidate: Product,
  targetNameKeywords: string[] | null | undefined
): boolean {
  if (typeof candidate.name !== "string" || !Array.isArray(targetNameKeywords)) {
    return false;
  }

  const candidateName = candidate.name.toLowerCase();

  return targetNameKeywords.some(
    (keyword) =>
      typeof keyword === "string" &&
      candidateName.includes(keyword.toLowerCase())
  );
}

function buildRecommendation(
  candidate: Product,
  rule: UpsellRule
): UpsellRecommendation {
  const revenueImpact = calculateRevenueImpact(candidate, UPSELL_QUANTITY);
  const marginImpactPercent = calculateMarginImpactPercent(candidate);

  return {
    productId: candidate.id,
    productName: candidate.name,
    reason: rule.reason,
    quantity: UPSELL_QUANTITY,
    revenueImpact,
    marginImpactPercent,
    confidence: sanitizeConfidence(rule.confidence),
  };
}

/**
 * Generates upsell/cross-sell recommendations for a deal.
 *
 * Eligibility (rule-based, deterministic — no ML/ranking model):
 *   - only active rules are considered
 *   - a rule only applies if the deal contains an item whose product
 *     category matches the rule's `sourceCategory`
 *   - only active candidate products are recommended
 *   - a product already present in the deal is never recommended
 *   - a product is never recommended more than once, even if multiple
 *     rules or multiple deal items would otherwise both point to it
 *
 * All deal items and all rules are evaluated (not just the first of
 * either), so multiple items can each surface their own valid
 * recommendations in the same call. Iteration order is the order `rules`
 * and `products` were supplied in, so results are stable and
 * reproducible for the same inputs — no randomness, no current-time or
 * external-call dependence.
 */
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
    if (!isRuleActive(rule)) {
      continue;
    }

    if (!dealCategories.has(normalizeCategory(rule.sourceCategory))) {
      continue;
    }

    for (const candidate of products) {
      if (!candidate || !candidate.isActive) {
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