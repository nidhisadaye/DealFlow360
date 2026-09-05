import {
  Customer,
  Deal,
  DiscountRule,
  Product,
} from "../shared/types";

export interface DiscountEvaluation {
  requested: number;
  allowed: number;

  exceeded: boolean;
  excessPercent: number;
}

/**
 * Wraps the contract-facing DiscountEvaluation together with diagnostic
 * `reasons` (rule-lookup misses, the exceeded-discount message, etc.).
 * `reasons` is intentionally NOT part of DiscountEvaluation itself so it
 * never leaks into the final DealEvaluation.discount object — callers that
 * want this diagnostic info (e.g. to fold into DealEvaluation.warnings)
 * read it off `reasons` here instead.
 */
export interface DiscountEvaluationResult {
  evaluation: DiscountEvaluation;
  reasons: string[];
}

export function evaluateDiscount(
  deal: Deal,
  customer: Customer,
  products: Product[],
  rules: DiscountRule[]
): DiscountEvaluationResult {
  const activeRules = rules.filter(
    (rule) => rule.isActive
  );

  const reasons: string[] = [];

  // Customer tier rule
  const customerRule = activeRules.find(
    (rule) =>
      rule.customerTier === customer.tier &&
      !rule.productCategory
  );

  let allowedDiscount =
    customerRule?.maxDiscountPercent ?? 0;

  if (!customerRule) {
    reasons.push(
      `No discount rule found for customer tier ${customer.tier}.`
    );
  }

  // Product category rules
  for (const item of deal.items) {
    const product = products.find(
      (product) =>
        product.id === item.productId
    );

    if (!product) {
      reasons.push(
        `Product ${item.productId} could not be found.`
      );
      continue;
    }

    const categoryRule = activeRules.find(
      (rule) =>
        rule.productCategory === product.category
    );

    if (categoryRule) {
      allowedDiscount = Math.min(
        allowedDiscount,
        categoryRule.maxDiscountPercent
      );
    }
  }

  const requestedDiscount =
    deal.discountPercent;

  const exceeded =
    requestedDiscount > allowedDiscount;

  const excessPercent =
    exceeded
      ? requestedDiscount - allowedDiscount
      : 0;

  if (exceeded) {
    reasons.push(
      `Requested discount of ${requestedDiscount}% exceeds allowed discount of ${allowedDiscount}%.`
    );
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