import {
  Customer,
  CustomerTier,
  Deal,
  DiscountRule,
  Product,
} from "../shared/types";

/**
 * Identifies a single active DiscountRule that actually participated in
 * (and currently binds) the final `allowed` discount value — as opposed to
 * merely happening to share the same `maxDiscountPercent` number.
 *
 * A rule only appears here if:
 *   1. It is active.
 *   2. It is applicable to this specific deal (matches the customer's tier,
 *      or matches a product category actually present on the deal).
 *   3. It is the rule actually selected for that scope (see "first matching
 *      active rule wins" precedence, preserved from the original engine).
 *   4. Its `maxDiscountPercent` is the value that determined the final
 *      `allowed` result (i.e. it is a binding constraint, not one that was
 *      overridden by a stricter rule elsewhere).
 */
export interface AppliedDiscountRule {
  ruleId: string;
  ruleName: string;
  scope: "CUSTOMER_TIER" | "PRODUCT_CATEGORY";
  customerTier?: CustomerTier;
  productCategory?: string;
  maxDiscountPercent: number;
}

/**
 * Describes two or more ACTIVE rules matching the same scope (the same
 * customer tier, or the same product category) that overlap with each
 * other. This is purely diagnostic governance information — it never
 * changes the deterministic discount decision itself.
 *
 * - DUPLICATE: the overlapping active rules all specify the same
 *   maxDiscountPercent.
 * - CONFLICTING: the overlapping active rules specify different
 *   maxDiscountPercent values.
 */
export interface DiscountRuleConflict {
  scope: "CUSTOMER_TIER" | "PRODUCT_CATEGORY";
  matchedValue: string;
  type: "DUPLICATE" | "CONFLICTING";
  ruleIds: string[];
  message: string;
}

export interface DiscountEvaluation {
  requested: number;
  allowed: number;

  exceeded: boolean;
  excessPercent: number;

  appliedRules: AppliedDiscountRule[];
  ruleConflicts: DiscountRuleConflict[];
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

/**
 * A rule that was actually selected as the "winner" for a given governance
 * scope (customer tier, or one specific product category), together with
 * the scope it was selected for. This is the internal bookkeeping used to
 * build `appliedRules` — it deliberately only ever contains rules that were
 * genuinely applicable to this deal, never the full rule set.
 */
interface ScopedCandidate {
  rule: DiscountRule;
  scope: "CUSTOMER_TIER" | "PRODUCT_CATEGORY";
}

function classifyOverlap(
  matchingRules: DiscountRule[]
): "DUPLICATE" | "CONFLICTING" {
  const uniqueLimits = new Set(
    matchingRules.map((rule) => rule.maxDiscountPercent)
  );

  return uniqueLimits.size === 1 ? "DUPLICATE" : "CONFLICTING";
}

function buildConflict(
  scope: "CUSTOMER_TIER" | "PRODUCT_CATEGORY",
  matchedValue: string,
  matchingRules: DiscountRule[]
): DiscountRuleConflict {
  const type = classifyOverlap(matchingRules);
  const ruleIds = matchingRules.map((rule) => rule.id);
  const scopeLabel =
    scope === "CUSTOMER_TIER" ? "customer tier" : "product category";

  const message =
    type === "DUPLICATE"
      ? `Duplicate active discount rules found for ${scopeLabel} "${matchedValue}" (${ruleIds.join(
          ", "
        )}).`
      : `Conflicting active discount rules found for ${scopeLabel} "${matchedValue}" with different limits (${ruleIds.join(
          ", "
        )}).`;

  return { scope, matchedValue, type, ruleIds, message };
}

function toAppliedRule(candidate: ScopedCandidate): AppliedDiscountRule {
  const { rule, scope } = candidate;

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    scope,
    customerTier: scope === "CUSTOMER_TIER" ? rule.customerTier : undefined,
    productCategory:
      scope === "PRODUCT_CATEGORY" ? rule.productCategory : undefined,
    maxDiscountPercent: rule.maxDiscountPercent,
  };
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
  const ruleConflicts: DiscountRuleConflict[] = [];

  // Rules that were actually selected as the "winner" for a scope, and are
  // therefore eligible to be reported in `appliedRules` once we know the
  // final allowed value. This never includes rules that merely exist in the
  // rule set — only ones genuinely applicable to this deal.
  const candidates: ScopedCandidate[] = [];

  // ------------------------------------------------------------------
  // Customer tier rule (existing precedence preserved: first matching
  // active rule wins, exactly as `Array.prototype.find` already behaved).
  // ------------------------------------------------------------------
  const matchingTierRules = activeRules.filter(
    (rule) =>
      rule.customerTier === customer.tier &&
      !rule.productCategory
  );

  const customerRule = matchingTierRules[0];

  let allowedDiscount =
    customerRule?.maxDiscountPercent ?? 0;

  if (!customerRule) {
    reasons.push(
      `No discount rule found for customer tier ${customer.tier}.`
    );
  } else {
    reasons.push(
      `Customer-tier rule "${customerRule.name}" applied for tier ${customer.tier} (${customerRule.maxDiscountPercent}%).`
    );

    candidates.push({ rule: customerRule, scope: "CUSTOMER_TIER" });
  }

  if (matchingTierRules.length > 1) {
    const conflict = buildConflict(
      "CUSTOMER_TIER",
      customer.tier,
      matchingTierRules
    );

    ruleConflicts.push(conflict);
    reasons.push(conflict.message);
  }

  // ------------------------------------------------------------------
  // Product category rules. Every deal item is inspected (not just the
  // first), and a category is only evaluated once for governance purposes
  // even if multiple items share it — matching the ORIGINAL engine's
  // numeric result exactly, since Math.min is idempotent for repeated
  // categories, while avoiding duplicate appliedRules/ruleConflicts entries.
  // ------------------------------------------------------------------
  const categoriesSeen = new Set<string>();

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

    const category = product.category;

    if (categoriesSeen.has(category)) {
      continue;
    }

    categoriesSeen.add(category);

    const matchingCategoryRules = activeRules.filter(
      (rule) => rule.productCategory === category
    );

    const categoryRule = matchingCategoryRules[0];

    if (categoryRule) {
      allowedDiscount = Math.min(
        allowedDiscount,
        categoryRule.maxDiscountPercent
      );

      reasons.push(
        `Product-category rule "${categoryRule.name}" applied for category ${category} (${categoryRule.maxDiscountPercent}%).`
      );

      candidates.push({ rule: categoryRule, scope: "PRODUCT_CATEGORY" });
    }

    if (matchingCategoryRules.length > 1) {
      const conflict = buildConflict(
        "PRODUCT_CATEGORY",
        category,
        matchingCategoryRules
      );

      ruleConflicts.push(conflict);
      reasons.push(conflict.message);
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
  } else {
    reasons.push(
      `Requested discount of ${requestedDiscount}% is within the allowed limit of ${allowedDiscount}%.`
    );
  }

  // A rule is only reported as "applied" if it actually binds the final
  // allowed value — i.e. its own limit ties the effective minimum. A rule
  // that was applicable but got overridden by a stricter rule elsewhere
  // (e.g. a GOLD-tier 15% limit overridden by a stricter 10% category
  // limit) did not determine the outcome and is correctly excluded, even
  // though it was a genuine, deal-relevant candidate.
  const appliedRules: AppliedDiscountRule[] = candidates
    .filter((candidate) => candidate.rule.maxDiscountPercent === allowedDiscount)
    .map(toAppliedRule);

  return {
    evaluation: {
      requested: requestedDiscount,
      allowed: allowedDiscount,
      exceeded,
      excessPercent,
      appliedRules,
      ruleConflicts,
    },
    reasons,
  };
}