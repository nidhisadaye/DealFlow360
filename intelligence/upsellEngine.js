"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUpsellRecommendations = generateUpsellRecommendations;
const DEFAULT_UPSELL_RULES = [
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
function normalizeCategory(category) {
    if (typeof category !== "string") {
        return "";
    }
    return category.trim().toLowerCase();
}
/**
 * A rule only participates if it is active. Absence of `isActive` (the
 * pre-Phase-4 shape) is treated as active, matching prior behavior.
 */
function isRuleActive(rule) {
    return rule.isActive !== false;
}
/**
 * Margin impact as a percentage of sale price. Never returns NaN/Infinity:
 * an unusable sale price (non-finite, zero, or negative) or an unusable
 * cost price (non-finite) deterministically yields 0 — a neutral,
 * explainable fallback — rather than propagating corrupted upstream data
 * into the recommendation.
 */
function calculateMarginImpactPercent(candidate) {
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
function calculateRevenueImpact(candidate, quantity) {
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
function sanitizeConfidence(confidence) {
    if (!Number.isFinite(confidence)) {
        return 0;
    }
    return Math.min(Math.max(confidence, 0), 1);
}
function matchesTargetName(candidate, targetNameKeywords) {
    if (typeof candidate.name !== "string" || !Array.isArray(targetNameKeywords)) {
        return false;
    }
    const candidateName = candidate.name.toLowerCase();
    return targetNameKeywords.some((keyword) => typeof keyword === "string" &&
        candidateName.includes(keyword.toLowerCase()));
}
function buildRecommendation(candidate, rule) {
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
function generateUpsellRecommendations(deal, products, rules = DEFAULT_UPSELL_RULES) {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const dealProductIds = new Set(deal.items.map((item) => item.productId));
    const dealCategories = new Set();
    for (const item of deal.items) {
        const product = productsById.get(item.productId);
        if (product) {
            dealCategories.add(normalizeCategory(product.category));
        }
    }
    const recommendations = [];
    const recommendedProductIds = new Set();
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
