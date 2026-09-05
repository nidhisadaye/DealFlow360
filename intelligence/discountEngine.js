"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateDiscount = evaluateDiscount;
function evaluateDiscount(deal, customer, products, rules) {
    const activeRules = rules.filter((rule) => rule.isActive);
    const reasons = [];
    // Customer tier rule
    const customerRule = activeRules.find((rule) => rule.customerTier === customer.tier &&
        !rule.productCategory);
    let allowedDiscount = customerRule?.maxDiscountPercent ?? 0;
    if (!customerRule) {
        reasons.push(`No discount rule found for customer tier ${customer.tier}.`);
    }
    // Product category rules
    for (const item of deal.items) {
        const product = products.find((product) => product.id === item.productId);
        if (!product) {
            reasons.push(`Product ${item.productId} could not be found.`);
            continue;
        }
        const categoryRule = activeRules.find((rule) => rule.productCategory === product.category);
        if (categoryRule) {
            allowedDiscount = Math.min(allowedDiscount, categoryRule.maxDiscountPercent);
        }
    }
    const requestedDiscount = deal.discountPercent;
    const exceeded = requestedDiscount > allowedDiscount;
    const excessPercent = exceeded
        ? requestedDiscount - allowedDiscount
        : 0;
    if (exceeded) {
        reasons.push(`Requested discount of ${requestedDiscount}% exceeds allowed discount of ${allowedDiscount}%.`);
    }
    return {
        evaluation: {
            requested: requestedDiscount,
            allowed: allowedDiscount,
            exceeded,
            excessPercent,
        },
        reasons,
    };
}
