// backend/config/discountRules.js
//
// This is the baseline policy used only when a development database has no
// active `discount_rules` rows. Production data in that table takes priority.
//
// IMPORTANT: these are the SAME rule values already used by
// intelligence/testDealEngine.ts (RULE-GOLD / RULE-HARDWARE). Nothing here
// is a new or invented business rule — this is just moving the existing
// agreed values into a place the backend can import them from.
//
// Shape matches intelligence's DiscountRule (shared/types.ts):
//   { id, name, customerTier?, productCategory?, maxDiscountPercent,
//     requiresApprovalAbove, isActive, createdAt, updatedAt }

const DISCOUNT_RULES = [
  {
    id: "RULE-GOLD",
    name: "Gold Customer Limit",
    customerTier: "GOLD",
    maxDiscountPercent: 15,
    requiresApprovalAbove: 15,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "RULE-HARDWARE",
    name: "Hardware Discount Limit",
    productCategory: "Hardware",
    maxDiscountPercent: 15,
    requiresApprovalAbove: 15,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * Returns the current discount rules. A function (not just the raw array)
 * so that later, if this really does move to a DB-backed config or an
 * admin-editable table, callers don't need to change — only this function's
 * internals would.
 */
function getDiscountRules() {
  return DISCOUNT_RULES;
}

module.exports = { getDiscountRules, DISCOUNT_RULES };
