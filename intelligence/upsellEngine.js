"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUpsellRecommendations = generateUpsellRecommendations;
const UPSELL_RULES = [
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
    return category.trim().toLowerCase();
}
function calculateMarginImpactPercent(candidate) {
    if (candidate.salePrice <= 0) {
        return 0;
    }
    const margin = candidate.salePrice - candidate.costPrice;
    return (margin / candidate.salePrice) * 100;
}
function matchesTargetName(candidate, targetNameKeywords) {
    const candidateName = candidate.name.toLowerCase();
    return targetNameKeywords.some((keyword) => candidateName.includes(keyword.toLowerCase()));
}
function buildRecommendation(candidate, rule) {
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
function generateUpsellRecommendations(deal, products) {
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
    for (const rule of UPSELL_RULES) {
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
