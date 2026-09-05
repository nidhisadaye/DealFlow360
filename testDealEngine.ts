/**
 * Phase 5 test suite for warehouseEngine, Phase 6 integration/orchestration
 * tests for dealEngine, plus regression coverage for Phase 1-4 behavior of
 * the surrounding deal-evaluation engines.
 *
 * This is a lightweight, dependency-free assertion runner (no test
 * framework required) so it can run directly under ts-node/node in any
 * environment.
 */

import {
  Customer,
  Deal,
  DealItem,
  DiscountRule,
  Inventory,
  Product,
  Warehouse,
} from "./shared/types";

import { allocateWarehouseInventory } from "./intelligence/warehouseEngine";
import { evaluateDiscount } from "./intelligence/discountEngine";
import { evaluateRisk } from "./intelligence/riskEngine";
import { determineApproval } from "./intelligence/approvalEngine";
import { generateUpsellRecommendations } from "./intelligence/upsellEngine";
import { evaluateDeal } from "./intelligence/dealEngine";

// ---------------------------------------------------------------------
// Minimal assertion helpers
// ---------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assertEqual<T>(actual: T, expected: T, label: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push(
      `${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(condition: boolean, label: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(`${label} (expected true, got false)`);
  }
}

// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------

function makeWarehouse(id: string, name: string, isActive = true): Warehouse {
  return { id, name, location: "N/A", isActive, createdAt: "2024-01-01" };
}

function makeInventory(
  warehouseId: string,
  productId: string,
  availableQuantity: number,
  reservedQuantity = 0
): Inventory {
  return {
    id: `inv-${warehouseId}-${productId}-${Math.random()}`,
    warehouseId,
    productId,
    availableQuantity,
    reservedQuantity,
    updatedAt: "2024-01-01",
  };
}

function makeDealItem(productId: string, quantity: number): DealItem {
  return {
    id: `item-${productId}`,
    dealId: "deal-1",
    productId,
    productName: productId,
    quantity,
    unitPrice: 100,
    unitCost: 60,
    billingType: "ONE_TIME",
    discountPercent: 0,
    subtotal: 100 * quantity,
    total: 100 * quantity,
  };
}

function makeDeal(items: DealItem[]): Deal {
  return {
    id: "deal-1",
    customerId: "cust-1",
    salesRepId: "rep-1",
    title: "Test deal",
    status: "DRAFT",
    items,
    discountPercent: 0,
    subtotal: 0,
    discountAmount: 0,
    totalAmount: 0,
    costAmount: 0,
    marginAmount: 0,
    marginPercent: 25,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "USD",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

function makeCustomer(tier: Customer["tier"]): Customer {
  return {
    id: `cust-${tier}`,
    name: "Test Customer",
    company: "Test Co",
    email: "customer@test.com",
    tier,
    isActive: true,
    createdAt: "2024-01-01",
  };
}

function makeProduct(
  id: string,
  category: string,
  salePrice = 100,
  costPrice = 60
): Product {
  return {
    id,
    name: id,
    category,
    type: "GOOD",
    billingType: "ONE_TIME",
    salePrice,
    costPrice,
    currency: "USD",
    isActive: true,
    createdAt: "2024-01-01",
  };
}

function makeTierRule(
  tier: Customer["tier"],
  maxDiscountPercent: number
): DiscountRule {
  return {
    id: `rule-${tier}`,
    name: `${tier} tier rule`,
    customerTier: tier,
    maxDiscountPercent,
    requiresApprovalAbove: maxDiscountPercent,
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

// =======================================================================
// PHASE 5 — WAREHOUSE ENGINE TESTS
// =======================================================================

// 1. Full allocation from one warehouse
(function test1() {
  const deal = makeDeal([makeDealItem("P1", 10)]);
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "Warehouse 1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test1: single allocation record");
  assertEqual(result[0].status, "ALLOCATED", "Test1: status ALLOCATED");
  assertEqual(result[0].quantity, 10, "Test1: full quantity allocated");
})();

// 2. Split allocation across two warehouses
(function test2() {
  const deal = makeDeal([makeDealItem("P1", 10)]);
  const inventory = [
    makeInventory("A", "P1", 6),
    makeInventory("B", "P1", 4),
  ];
  const warehouses = [makeWarehouse("A", "A"), makeWarehouse("B", "B")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 2, "Test2: two allocation records");
  assertEqual(result[0].warehouseId, "A", "Test2: A allocated first");
  assertEqual(result[0].quantity, 6, "Test2: A gets 6");
  assertEqual(result[1].warehouseId, "B", "Test2: B allocated second");
  assertEqual(result[1].quantity, 4, "Test2: B gets 4");
  assertTrue(
    result.every((r) => r.status === "ALLOCATED"),
    "Test2: both records ALLOCATED"
  );
})();

// 3. Split allocation across three warehouses
(function test3() {
  const deal = makeDeal([makeDealItem("P1", 15)]);
  const inventory = [
    makeInventory("A", "P1", 5),
    makeInventory("B", "P1", 5),
    makeInventory("C", "P1", 5),
  ];
  const warehouses = [
    makeWarehouse("A", "A"),
    makeWarehouse("B", "B"),
    makeWarehouse("C", "C"),
  ];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 3, "Test3: three allocation records");
  assertEqual(
    result.reduce((sum, r) => sum + r.quantity, 0),
    15,
    "Test3: total allocated equals required"
  );
  assertTrue(
    result.every((r) => r.status === "ALLOCATED"),
    "Test3: all ALLOCATED"
  );
})();

// 4. Partial allocation
(function test4() {
  const deal = makeDeal([makeDealItem("P1", 10)]);
  const inventory = [makeInventory("A", "P1", 6), makeInventory("B", "P1", 2)];
  const warehouses = [makeWarehouse("A", "A"), makeWarehouse("B", "B")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 2, "Test4: two allocation records");
  assertTrue(
    result.every((r) => r.status === "PARTIAL"),
    "Test4: both PARTIAL"
  );
  assertEqual(
    result.reduce((sum, r) => sum + r.quantity, 0),
    8,
    "Test4: total allocated is 8 (never phantom)"
  );
})();

// 5. Completely unavailable product
(function test5() {
  const deal = makeDeal([makeDealItem("P1", 10)]);
  const inventory = [makeInventory("A", "P1", 0), makeInventory("B", "P1", 0)];
  const warehouses = [makeWarehouse("A", "A"), makeWarehouse("B", "B")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test5: single UNAVAILABLE record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test5: status UNAVAILABLE");
  assertEqual(result[0].quantity, 0, "Test5: zero quantity");
  assertEqual(result[0].warehouseId, "A", "Test5: representative is first active warehouse");
})();

// 6. No active warehouses -> UNASSIGNED
(function test6() {
  const deal = makeDeal([makeDealItem("P1", 10)]);
  const inventory = [makeInventory("A", "P1", 10)];
  const warehouses = [makeWarehouse("A", "A", false)];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test6: single record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test6: status remains UNAVAILABLE");
  assertEqual(result[0].warehouseId, "UNASSIGNED", "Test6: warehouseId UNASSIGNED");
})();

// 7. Zero inventory
(function test7() {
  const deal = makeDeal([makeDealItem("P1", 5)]);
  const inventory: Inventory[] = [makeInventory("A", "P1", 0)];
  const warehouses = [makeWarehouse("A", "A")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test7: single record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test7: UNAVAILABLE for zero inventory");
})();

// 8. Negative inventory never increases availability
(function test8() {
  const deal = makeDeal([makeDealItem("P1", 5)]);
  const inventory: Inventory[] = [makeInventory("A", "P1", -100)];
  const warehouses = [makeWarehouse("A", "A")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test8: single record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test8: negative inventory treated as none");
  assertTrue(result[0].quantity >= 0, "Test8: quantity never negative");
})();

// 9. Duplicate inventory rows are aggregated, not double-counted as separate warehouses
(function test9() {
  const deal = makeDeal([makeDealItem("P1", 8)]);
  const inventory: Inventory[] = [
    makeInventory("A", "P1", 5),
    makeInventory("A", "P1", 5),
  ];
  const warehouses = [makeWarehouse("A", "A")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test9: single allocation record (one warehouse)");
  assertEqual(result[0].quantity, 8, "Test9: allocates required amount from aggregated stock");
  assertEqual(result[0].status, "ALLOCATED", "Test9: ALLOCATED since aggregated stock (10) covers requirement");
})();

// 10. Multiple products evaluated independently
(function test10() {
  const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 20)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", 10),
    makeInventory("W1", "B", 5),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  const forA = result.filter((r) => r.productId === "A");
  const forB = result.filter((r) => r.productId === "B");

  assertEqual(forA.length, 1, "Test10: one record for A");
  assertEqual(forA[0].status, "ALLOCATED", "Test10: A fully allocated");
  assertEqual(forA[0].quantity, 10, "Test10: A gets 10");

  assertEqual(forB.length, 1, "Test10: one record for B");
  assertEqual(forB[0].status, "PARTIAL", "Test10: B partially allocated");
  assertEqual(forB[0].quantity, 5, "Test10: B gets only what's available");
})();

// 11. One product full + another partial (no cross-contamination)
(function test11() {
  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", 5),
    makeInventory("W1", "B", 3),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  const forA = result.find((r) => r.productId === "A")!;
  const forB = result.find((r) => r.productId === "B")!;

  assertEqual(forA.status, "ALLOCATED", "Test11: A ALLOCATED");
  assertEqual(forB.status, "PARTIAL", "Test11: B PARTIAL");
  assertEqual(forB.quantity, 3, "Test11: B not inflated by A's stock");
})();

// 12. One product full + another unavailable
(function test12() {
  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", 5),
    makeInventory("W1", "B", 0),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  const forA = result.find((r) => r.productId === "A")!;
  const forB = result.find((r) => r.productId === "B")!;

  assertEqual(forA.status, "ALLOCATED", "Test12: A ALLOCATED");
  assertEqual(forB.status, "UNAVAILABLE", "Test12: B UNAVAILABLE");
})();

// 13. Inventory greater than required -> never allocate more than required
(function test13() {
  const deal = makeDeal([makeDealItem("A", 10)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 100)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test13: single record");
  assertEqual(result[0].quantity, 10, "Test13: only required quantity allocated, not all 100");
  assertEqual(result[0].status, "ALLOCATED", "Test13: ALLOCATED");
})();

// 14. Required quantity zero -> no allocation records
(function test14() {
  const deal = makeDeal([makeDealItem("A", 0)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 0, "Test14: zero required quantity produces no allocation");
})();

// 15. Negative required quantity -> no allocation, never negative output
(function test15() {
  const deal = makeDeal([makeDealItem("A", -5)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 0, "Test15: negative required quantity produces no allocation");
})();

// 16. Invalid/NaN quantity -> handled without crashing, no phantom allocation
(function test16() {
  const deal = makeDeal([makeDealItem("A", NaN)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 0, "Test16: NaN quantity produces no allocation");
  assertTrue(
    result.every((r) => Number.isFinite(r.quantity)),
    "Test16: no NaN in output"
  );
})();

// 17. Infinity quantity -> handled without crashing, never hangs or produces NaN/Infinity
(function test17() {
  const deal = makeDeal([makeDealItem("A", Infinity)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 0, "Test17: Infinity quantity produces no allocation");
  assertTrue(
    result.every((r) => Number.isFinite(r.quantity)),
    "Test17: no Infinity in output"
  );
})();

// 18. Invalid inventory quantity (NaN in inventory record) -> treated as unusable, no crash
(function test18() {
  const deal = makeDeal([makeDealItem("A", 5)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", NaN),
    makeInventory("W2", "A", Infinity),
  ];
  const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test18: single record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test18: invalid inventory treated as zero usable stock");
  assertTrue(
    result.every((r) => Number.isFinite(r.quantity)),
    "Test18: no NaN/Infinity in output"
  );
})();

// 19. Multiple warehouses with deterministic ordering
(function test19() {
  const deal = makeDeal([makeDealItem("A", 10)]);
  const inventory: Inventory[] = [
    makeInventory("Z", "A", 5),
    makeInventory("A", "A", 5),
  ];
  const warehouses = [makeWarehouse("Z", "Z warehouse"), makeWarehouse("A", "A warehouse")];

  const result1 = allocateWarehouseInventory(deal, inventory, warehouses);
  const result2 = allocateWarehouseInventory(deal, inventory, warehouses);

  // Order follows the order warehouses were supplied in (Z before A here),
  // not alphabetical id order -- and must be identical across calls.
  assertEqual(result1[0].warehouseId, "Z", "Test19: allocation follows supplied warehouse order");
  assertEqual(result1, result2, "Test19: identical result across repeated calls");
})();

// 20. Repeated evaluation of the same deal produces the same result (no hidden state)
(function test20() {
  const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 3)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", 6),
    makeInventory("W2", "A", 6),
    makeInventory("W1", "B", 1),
  ];
  const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];

  const first = allocateWarehouseInventory(deal, inventory, warehouses);
  const second = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(first, second, "Test20: repeated evaluation is stable");
})();

// 21. Empty inventory
(function test21() {
  const deal = makeDeal([makeDealItem("A", 5)]);
  const inventory: Inventory[] = [];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test21: single record");
  assertEqual(result[0].status, "UNAVAILABLE", "Test21: UNAVAILABLE with empty inventory");
})();

// 22. Empty warehouse list
(function test22() {
  const deal = makeDeal([makeDealItem("A", 5)]);
  const inventory: Inventory[] = [makeInventory("W1", "A", 10)];
  const warehouses: Warehouse[] = [];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test22: single record");
  assertEqual(result[0].warehouseId, "UNASSIGNED", "Test22: UNASSIGNED with no warehouses at all");
})();

// 23. Large quantities
(function test23() {
  const deal = makeDeal([makeDealItem("A", 5_000_000)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", 3_000_000),
    makeInventory("W2", "A", 3_000_000),
  ];
  const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(
    result.reduce((sum, r) => sum + r.quantity, 0),
    5_000_000,
    "Test23: large-quantity allocation totals exactly the requirement"
  );
  assertTrue(
    result.every((r) => r.status === "ALLOCATED"),
    "Test23: ALLOCATED for large quantities"
  );
})();

// 24. Mixed valid and invalid inventory rows for the same product
(function test24() {
  const deal = makeDeal([makeDealItem("A", 10)]);
  const inventory: Inventory[] = [
    makeInventory("W1", "A", -50),
    makeInventory("W1", "A", 6),
    makeInventory("W1", "A", NaN),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const result = allocateWarehouseInventory(deal, inventory, warehouses);

  assertEqual(result.length, 1, "Test24: single record");
  assertEqual(result[0].quantity, 6, "Test24: only the valid 6 units counted as usable");
  assertEqual(result[0].status, "PARTIAL", "Test24: PARTIAL since usable stock is only 6 of 10");
})();

// 25. Regression: existing dealEngine end-to-end orchestration still works
(function test25() {
  const customer: Customer = {
    id: "cust-1",
    name: "Acme Co",
    company: "Acme",
    email: "a@acme.com",
    tier: "GOLD",
    isActive: true,
    createdAt: "2024-01-01",
  };

  const product: Product = {
    id: "P1",
    name: "Widget",
    category: "Hardware",
    type: "GOOD",
    billingType: "ONE_TIME",
    salePrice: 100,
    costPrice: 60,
    currency: "USD",
    isActive: true,
    createdAt: "2024-01-01",
  };

  const rule: DiscountRule = {
    id: "r1",
    name: "Gold tier",
    customerTier: "GOLD",
    maxDiscountPercent: 15,
    requiresApprovalAbove: 15,
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(
    deal,
    customer,
    [product],
    [rule],
    inventory,
    warehouses
  );

  assertEqual(evaluation.status, "APPROVED", "Test25: within-limit discount does not require approval");
  assertEqual(
    evaluation.warehouseAllocation[0].status,
    "ALLOCATED",
    "Test25: warehouse allocation still flows through dealEngine"
  );
})();

// 26. Regression: discountEngine / riskEngine / approvalEngine / upsellEngine untouched behavior
(function test26() {
  const customer: Customer = {
    id: "cust-1",
    name: "Acme Co",
    company: "Acme",
    email: "a@acme.com",
    tier: "SILVER",
    isActive: true,
    createdAt: "2024-01-01",
  };

  const product: Product = {
    id: "P1",
    name: "Widget",
    category: "Hardware",
    type: "GOOD",
    billingType: "ONE_TIME",
    salePrice: 100,
    costPrice: 60,
    currency: "USD",
    isActive: true,
    createdAt: "2024-01-01",
  };

  const rule: DiscountRule = {
    id: "r1",
    name: "Silver tier",
    customerTier: "SILVER",
    maxDiscountPercent: 5,
    requiresApprovalAbove: 5,
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  const deal = makeDeal([makeDealItem("P1", 5)]);
  deal.discountPercent = 20;
  deal.marginPercent = -5;

  const { evaluation: discountEvaluation } = evaluateDiscount(
    deal,
    customer,
    [product],
    [rule]
  );

  assertTrue(discountEvaluation.exceeded, "Test26: discount exceeded flag still works");

  const riskEvaluation = evaluateRisk(deal, discountEvaluation, []);
  assertTrue(riskEvaluation.riskScore > 0, "Test26: risk engine still scores risk");

  const approval = determineApproval(discountEvaluation, riskEvaluation, deal.marginPercent);
  assertTrue(approval.required, "Test26: negative margin + exceeded discount requires approval");

  const upsells = generateUpsellRecommendations(deal, [
    product,
    {
      id: "P2",
      name: "Extended Warranty",
      category: "Hardware",
      type: "SERVICE",
      billingType: "ONE_TIME",
      salePrice: 20,
      costPrice: 5,
      currency: "USD",
      isActive: true,
      createdAt: "2024-01-01",
    },
  ]);
  assertEqual(upsells.length, 1, "Test26: upsell engine still recommends related products");
})();

// =======================================================================
// PHASE 6 — DEAL ENGINE ORCHESTRATION / INTEGRATION TESTS
// =======================================================================

// 27. Safe discount + safe margin + full inventory -> APPROVED
(function test27() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "Test27: no approval required");
  assertEqual(evaluation.status, "APPROVED", "Test27: status APPROVED");
  assertEqual(evaluation.warehouseAllocation[0].status, "ALLOCATED", "Test27: fully allocated");
})();

// 28. Excessive discount + full inventory -> APPROVAL_REQUIRED, fulfillment untouched
(function test28() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20; // exceeds 15% by 5
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertTrue(evaluation.discount.exceeded, "Test28: discount reported as exceeded");
  assertEqual(evaluation.approval.required, true, "Test28: approval required from discount trigger");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test28: status APPROVAL_REQUIRED");
  assertEqual(
    evaluation.warehouseAllocation[0].status,
    "ALLOCATED",
    "Test28: warehouse allocation still reports fully allocated, unaffected by approval"
  );
})();

// 29. Excessive discount + partial inventory -> APPROVAL_REQUIRED, both conditions surfaced
(function test29() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 6)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "Test29: approval required");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test29: status APPROVAL_REQUIRED");
  assertEqual(evaluation.warehouseAllocation[0].status, "PARTIAL", "Test29: allocation still reports PARTIAL");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("exceeds allowed discount")),
    "Test29: warnings mention discount excess"
  );
  assertTrue(
    evaluation.warnings.some((w) => w.includes("partially fulfilled")),
    "Test29: warnings mention partial fulfillment"
  );
})();

// 30. Excessive discount + unavailable inventory -> APPROVAL_REQUIRED via both discount and risk triggers
(function test30() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.riskLevel, "HIGH", "Test30: combined discount+inventory risk reaches HIGH");
  assertEqual(evaluation.approval.required, true, "Test30: approval required");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test30: status APPROVAL_REQUIRED");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("no available inventory")),
    "Test30: warnings mention stock-out"
  );
})();

// 31. Excessive discount + negative margin -> all three approval triggers fire together
(function test31() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = -5;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.riskLevel, "CRITICAL", "Test31: discount+margin risk reaches CRITICAL");
  assertEqual(evaluation.approval.required, true, "Test31: approval required");
  assertTrue(
    evaluation.approval.reason.includes("Discount exceeds"),
    "Test31: approval reason includes discount trigger"
  );
  assertTrue(
    evaluation.approval.reason.includes("risk is critical"),
    "Test31: approval reason includes risk trigger"
  );
  assertTrue(
    evaluation.approval.reason.includes("margin is zero or negative"),
    "Test31: approval reason includes margin trigger"
  );
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test31: status APPROVAL_REQUIRED");
})();

// 32. Safe discount + negative margin -> approval required from margin alone
(function test32() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = -5;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.discount.exceeded, false, "Test32: discount within limit");
  assertEqual(evaluation.approval.required, true, "Test32: approval required due to margin");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test32: status APPROVAL_REQUIRED");
})();

// 33. Safe discount + unavailable inventory (risk stays below the approval threshold) -> FULFILLMENT_PENDING
(function test33() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 25;

  const inventory = [makeInventory("W1", "P1", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "Test33: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "Test33: status FULFILLMENT_PENDING, not APPROVED");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("no available inventory")),
    "Test33: warnings mention stock-out"
  );
})();

// 34. Multiple products, mixed inventory outcomes evaluated independently
(function test34() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [
    makeInventory("W1", "A", 10),
    makeInventory("W1", "B", 6),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  const allocA = evaluation.warehouseAllocation.find((a) => a.productId === "A")!;
  const allocB = evaluation.warehouseAllocation.find((a) => a.productId === "B")!;

  assertEqual(allocA.status, "ALLOCATED", "Test34: product A fully allocated");
  assertEqual(allocB.status, "PARTIAL", "Test34: product B only partially allocated");
  assertEqual(evaluation.approval.required, false, "Test34: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "Test34: overall status reflects B's shortfall");
})();

// 35. Multiple products, deal-level negative margin still triggers approval
(function test35() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 10;
  deal.marginPercent = -10;

  const inventory = [makeInventory("W1", "A", 5), makeInventory("W1", "B", 5)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "Test35: negative deal margin requires approval regardless of item count");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test35: status APPROVAL_REQUIRED");
})();

// 36. Multiple products + upsell recommendations, all items fully allocated
(function test36() {
  const customer = makeCustomer("GOLD");
  const hardware = makeProduct("A", "Hardware");
  const software = makeProduct("B", "Software");
  const warranty = makeProduct("C", "Hardware", 20, 5);
  warranty.name = "Extended Warranty Plan";
  const implementation = makeProduct("D", "Software", 30, 10);
  implementation.name = "Implementation Service";
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "A", 10), makeInventory("W1", "B", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(
    deal,
    customer,
    [hardware, software, warranty, implementation],
    [rule],
    inventory,
    warehouses
  );

  assertEqual(evaluation.upsells.length, 2, "Test36: one upsell recommendation per category");
  assertTrue(
    evaluation.warehouseAllocation.every((a) => a.status === "ALLOCATED"),
    "Test36: both deal items fully allocated"
  );
  assertEqual(evaluation.status, "APPROVED", "Test36: status APPROVED");
})();

// 37. No active warehouses + approval required -> approval overrides, fulfillment gap still surfaced
(function test37() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1", false)]; // inactive

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "Test37: approval required from discount trigger");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test37: approval overrides fulfillment state");
  assertEqual(evaluation.warehouseAllocation[0].warehouseId, "UNASSIGNED", "Test37: no active warehouse to assign");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("No active warehouses")),
    "Test37: warnings surface the missing-warehouse condition even though approval dominates status"
  );
})();

// 38. Re-evaluation: unsafe -> safe reflects current inputs, not a stale prior result
(function test38() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const unsafeDeal = makeDeal([makeDealItem("P1", 10)]);
  unsafeDeal.discountPercent = 20;
  unsafeDeal.marginPercent = 35;

  const firstEvaluation = evaluateDeal(unsafeDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(firstEvaluation.status, "APPROVAL_REQUIRED", "Test38: first evaluation is APPROVAL_REQUIRED");

  const safeDeal = makeDeal([makeDealItem("P1", 10)]);
  safeDeal.discountPercent = 10;
  safeDeal.marginPercent = 35;

  const secondEvaluation = evaluateDeal(safeDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(secondEvaluation.status, "APPROVED", "Test38: re-evaluation with corrected discount is APPROVED");
})();

// 39. Re-evaluation: safe -> unsafe also reflects current inputs
(function test39() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const safeDeal = makeDeal([makeDealItem("P1", 10)]);
  safeDeal.discountPercent = 10;
  safeDeal.marginPercent = 35;

  const firstEvaluation = evaluateDeal(safeDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(firstEvaluation.status, "APPROVED", "Test39: first evaluation is APPROVED");

  const unsafeDeal = makeDeal([makeDealItem("P1", 10)]);
  unsafeDeal.discountPercent = 25;
  unsafeDeal.marginPercent = 35;

  const secondEvaluation = evaluateDeal(unsafeDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(secondEvaluation.status, "APPROVAL_REQUIRED", "Test39: re-evaluation with worse discount is APPROVAL_REQUIRED");
})();

// 40. All major risk factors simultaneously
(function test40() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 30; // excess 15 -> discount risk capped at 40
  deal.marginPercent = -10; // margin risk 40

  const inventory = [makeInventory("W1", "P1", 0)]; // inventory risk 20
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.riskLevel, "CRITICAL", "Test40: all factors combined reach CRITICAL");
  assertEqual(evaluation.approval.required, true, "Test40: approval required");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test40: status APPROVAL_REQUIRED");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("exceeds allowed discount")),
    "Test40: warnings capture discount issue"
  );
  assertTrue(
    evaluation.warnings.some((w) => w.includes("margin is negative")),
    "Test40: warnings capture margin issue"
  );
  assertTrue(
    evaluation.warnings.some((w) => w.includes("no available inventory")),
    "Test40: warnings capture inventory issue"
  );
})();

// 41. No risk factors simultaneously -> clean, low-risk approval-free deal
(function test41() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 5;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.riskScore, 0, "Test41: riskScore is zero");
  assertEqual(evaluation.riskLevel, "LOW", "Test41: riskLevel LOW");
  assertEqual(evaluation.approval.required, false, "Test41: no approval required");
  assertEqual(evaluation.status, "APPROVED", "Test41: status APPROVED");
  assertTrue(
    !evaluation.warnings.some(
      (w) =>
        w.includes("exceeds") ||
        w.includes("negative") ||
        w.includes("partially") ||
        w.includes("no available") ||
        w.includes("No active warehouses")
    ),
    "Test41: no problem-signaling warnings present"
  );
})();

// 42. Missing discount rule -> zero allowed discount, any positive request exceeds it
(function test42() {
  const customer = makeCustomer("BRONZE");
  const product = makeProduct("P1", "Hardware");

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 5;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [], inventory, warehouses);

  assertEqual(evaluation.discount.allowed, 0, "Test42: no matching rule means zero allowed discount");
  assertTrue(evaluation.discount.exceeded, "Test42: any positive discount exceeds a zero allowance");
  assertEqual(evaluation.approval.required, true, "Test42: approval required");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("No discount rule found")),
    "Test42: warnings surface the missing-rule diagnostic"
  );
})();

// 43. Duplicate inventory rows aggregate correctly end-to-end
(function test43() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 8)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [
    makeInventory("W1", "P1", 5),
    makeInventory("W1", "P1", 5),
  ];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.warehouseAllocation.length, 1, "Test43: duplicate rows treated as one warehouse");
  assertEqual(evaluation.warehouseAllocation[0].quantity, 8, "Test43: allocates from aggregated stock");
  assertEqual(evaluation.status, "APPROVED", "Test43: status APPROVED");
})();

// 44. Invalid numeric input (NaN margin) never leaks NaN into computed fields
(function test44() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = NaN;

  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "Test44: undeterminable margin requires approval");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test44: status APPROVAL_REQUIRED");
  assertTrue(Number.isFinite(evaluation.riskScore), "Test44: riskScore stays finite despite NaN input");
  assertTrue(
    Number.isFinite(evaluation.riskScore) && evaluation.riskScore >= 0 && evaluation.riskScore <= 100,
    "Test44: riskScore stays within valid bounds"
  );
})();

// 45. Zero inventory end-to-end with approval not required
(function test45() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "Test45: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "Test45: status FULFILLMENT_PENDING due to zero stock");
})();

// 46. Partial fulfillment across multiple warehouses end-to-end
(function test46() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  const inventory = [makeInventory("W1", "P1", 6), makeInventory("W2", "P1", 3)];
  const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.warehouseAllocation.length, 2, "Test46: two warehouse allocation records");
  assertTrue(
    evaluation.warehouseAllocation.every((a) => a.status === "PARTIAL"),
    "Test46: both records reported PARTIAL"
  );
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "Test46: overall status FULFILLMENT_PENDING");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("partially fulfilled")),
    "Test46: warnings mention partial fulfillment"
  );
})();

// 47. Conflicting conditions: nothing gets lost when every engine reports a problem at once
(function test47() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const warranty = makeProduct("P2", "Hardware", 20, 5);
  warranty.name = "Extended Warranty Plan";
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20; // exceeded
  deal.marginPercent = -5; // negative margin

  const inventory = [makeInventory("W1", "P1", 6)]; // partial
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product, warranty], [rule], inventory, warehouses);

  assertTrue(evaluation.discount.exceeded, "Test47: discount excess preserved");
  assertTrue(
    evaluation.riskLevel === "HIGH" || evaluation.riskLevel === "CRITICAL",
    "Test47: elevated risk preserved"
  );
  assertEqual(evaluation.approval.required, true, "Test47: approval requirement preserved");
  assertEqual(evaluation.upsells.length, 1, "Test47: upsell recommendation preserved");
  assertEqual(evaluation.warehouseAllocation[0].status, "PARTIAL", "Test47: partial fulfillment preserved");
  assertTrue(
    evaluation.warnings.some((w) => w.includes("exceeds allowed discount")),
    "Test47: discount warning present"
  );
  assertTrue(
    evaluation.warnings.some((w) => w.includes("margin is negative")),
    "Test47: margin warning present"
  );
  assertTrue(
    evaluation.warnings.some((w) => w.includes("partially fulfilled")),
    "Test47: fulfillment warning present"
  );
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "Test47: final status coherent (approval gate wins)");
})();

// 48. Determinism: identical inputs produce identical results and are never mutated
(function test48() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Software");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 4)]);
  deal.discountPercent = 12;
  deal.marginPercent = 18;

  const inventory = [
    makeInventory("W1", "A", 6),
    makeInventory("W2", "A", 6),
    makeInventory("W1", "B", 2),
  ];
  const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];

  const dealSnapshotBefore = JSON.stringify(deal);
  const inventorySnapshotBefore = JSON.stringify(inventory);
  const warehousesSnapshotBefore = JSON.stringify(warehouses);

  const first = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);
  const second = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  assertEqual(first, second, "Test48: repeated evaluation with identical input is deterministic");
  assertEqual(JSON.stringify(deal), dealSnapshotBefore, "Test48: deal input not mutated");
  assertEqual(JSON.stringify(inventory), inventorySnapshotBefore, "Test48: inventory input not mutated");
  assertEqual(JSON.stringify(warehouses), warehousesSnapshotBefore, "Test48: warehouses input not mutated");
})();

// =======================================================================
// PHASE 6 REFINEMENT — CROSS-ENGINE STATUS PRECEDENCE (LETTERED CASES)
// =======================================================================

// A. Approval required + fully allocated -> APPROVAL_REQUIRED
(function testA() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20; // exceeds -> approval required
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 10)]; // fully allocatable
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "TestA: approval required");
  assertEqual(evaluation.warehouseAllocation[0].status, "ALLOCATED", "TestA: fully allocated");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "TestA: status APPROVAL_REQUIRED");
})();

// B. Approval required + partial -> APPROVAL_REQUIRED
(function testB() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 6)]; // partial
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "TestB: approval required");
  assertEqual(evaluation.warehouseAllocation[0].status, "PARTIAL", "TestB: partial allocation");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "TestB: status APPROVAL_REQUIRED");
})();

// C. Approval required + unavailable -> APPROVAL_REQUIRED
(function testC() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 20;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 0)]; // unavailable
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "TestC: approval required");
  assertEqual(evaluation.warehouseAllocation[0].status, "UNAVAILABLE", "TestC: unavailable allocation");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "TestC: status APPROVAL_REQUIRED");
})();

// D. Approval not required + fully allocated -> APPROVED
(function testD() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "TestD: approval not required");
  assertEqual(evaluation.status, "APPROVED", "TestD: status APPROVED");
})();

// E. Approval not required + partial -> FULFILLMENT_PENDING
(function testE() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 6)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "TestE: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "TestE: status FULFILLMENT_PENDING");
})();

// F. Approval not required + unavailable -> FULFILLMENT_PENDING (DEAL-004 shape)
(function testF() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "TestF: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "TestF: status FULFILLMENT_PENDING");
})();

// G. Multiple deal items, all allocated -> APPROVED
(function testG() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "A", 5), makeInventory("W1", "B", 5)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  assertEqual(evaluation.status, "APPROVED", "TestG: status APPROVED when every item is fully allocated");
})();

// H. Multiple deal items, one partial/unavailable, approval not required -> FULFILLMENT_PENDING
(function testH() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "A", 5), makeInventory("W1", "B", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "TestH: approval not required");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "TestH: status FULFILLMENT_PENDING when any item is incomplete");
})();

// I. Multiple deal items, approval required and fulfillment incomplete -> APPROVAL_REQUIRED
(function testI() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 20; // exceeds -> approval required
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "A", 5), makeInventory("W1", "B", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "TestI: approval required");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "TestI: approval gate wins over incomplete fulfillment");
})();

// J. Empty/zero-quantity edge cases -> deterministic, safe behavior
(function testJ() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  // J1: no items at all -- nothing requires fulfillment.
  const emptyDeal = makeDeal([]);
  emptyDeal.discountPercent = 0;
  emptyDeal.marginPercent = 35;
  const evalEmpty = evaluateDeal(emptyDeal, customer, [product], [rule], [], []);
  assertEqual(evalEmpty.warehouseAllocation.length, 0, "TestJ1: no allocation records for an empty deal");
  assertEqual(evalEmpty.status, "APPROVED", "TestJ1: empty deal is vacuously fulfilled -> APPROVED");

  // J2: item with zero quantity -- nothing required, should not force FULFILLMENT_PENDING.
  const zeroQtyDeal = makeDeal([makeDealItem("P1", 0)]);
  zeroQtyDeal.discountPercent = 0;
  zeroQtyDeal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];
  const evalZeroQty = evaluateDeal(zeroQtyDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(evalZeroQty.warehouseAllocation.length, 0, "TestJ2: zero-quantity item produces no allocation record");
  assertEqual(evalZeroQty.status, "APPROVED", "TestJ2: zero-quantity item does not block APPROVED");

  // J3: item with negative quantity -- same treatment as zero.
  const negativeQtyDeal = makeDeal([makeDealItem("P1", -5)]);
  negativeQtyDeal.discountPercent = 0;
  negativeQtyDeal.marginPercent = 35;
  const evalNegativeQty = evaluateDeal(negativeQtyDeal, customer, [product], [rule], inventory, warehouses);
  assertEqual(evalNegativeQty.status, "APPROVED", "TestJ3: negative-quantity item does not block APPROVED");
})();

// K. Re-evaluation with identical inputs produces the identical final status
(function testK() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 6)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const first = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);
  const second = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(first.status, second.status, "TestK: repeated evaluation yields the same status");
  assertEqual(first, second, "TestK: repeated evaluation yields the fully identical result");
})();

// ---------------------------------------------------------------------
// Named regression scenarios explicitly called out for this refinement
// ---------------------------------------------------------------------

// DEAL-001: 18% discount vs 15% allowed -> approval required
(function testDeal001() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 18;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "DEAL-001: approval required");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "DEAL-001: status APPROVAL_REQUIRED");
})();

// DEAL-002: 10% discount vs 15% allowed, fully allocated -> no approval, APPROVED
(function testDeal002() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "DEAL-002: no approval required");
  assertEqual(evaluation.status, "APPROVED", "DEAL-002: status APPROVED");
})();

// DEAL-003: negative margin -> existing approval/risk behavior remains intact
(function testDeal003() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = -8;
  const inventory = [makeInventory("W1", "P1", 10)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, true, "DEAL-003: negative margin still requires approval");
  assertEqual(evaluation.status, "APPROVAL_REQUIRED", "DEAL-003: status APPROVAL_REQUIRED");
})();

// DEAL-004: zero inventory, no approval required -> FULFILLMENT_PENDING (was APPROVED pre-refinement)
(function testDeal004() {
  const customer = makeCustomer("GOLD");
  const product = makeProduct("P1", "Hardware");
  const rule = makeTierRule("GOLD", 15);
  const deal = makeDeal([makeDealItem("P1", 10)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;
  const inventory = [makeInventory("W1", "P1", 0)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [product], [rule], inventory, warehouses);

  assertEqual(evaluation.approval.required, false, "DEAL-004: no approval required");
  assertEqual(
    evaluation.warehouseAllocation[0].status,
    "UNAVAILABLE",
    "DEAL-004: warehouse allocation still reports UNAVAILABLE"
  );
  assertEqual(
    evaluation.status,
    "FULFILLMENT_PENDING",
    "DEAL-004: status now correctly reflects unavailable fulfillment"
  );
})();

// Edge case explicitly called out: a required product with no matching
// allocation record at all must be treated conservatively as incomplete,
// not silently assumed fine just because the array happens to be "checked".
(function testMissingAllocationRecord() {
  const customer = makeCustomer("GOLD");
  const productA = makeProduct("A", "Hardware");
  const productB = makeProduct("B", "Hardware");
  const rule = makeTierRule("GOLD", 15);

  const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
  deal.discountPercent = 10;
  deal.marginPercent = 35;

  // Only product A has any inventory/warehouse data; B has none, but B is
  // still a valid, positive-quantity requirement on the deal.
  const inventory = [makeInventory("W1", "A", 5)];
  const warehouses = [makeWarehouse("W1", "W1")];

  const evaluation = evaluateDeal(deal, customer, [productA, productB], [rule], inventory, warehouses);

  const recordsForB = evaluation.warehouseAllocation.filter((a) => a.productId === "B");
  assertTrue(recordsForB.length > 0, "MissingAllocation: warehouseEngine still reports an UNAVAILABLE record for B");
  assertEqual(evaluation.status, "FULFILLMENT_PENDING", "MissingAllocation: incomplete requirement blocks APPROVED");
})();

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
if (failures.length > 0) {
  console.log("\nFailures:\n" + failures.join("\n\n"));
  // Signal failure to the caller without depending on @types/node being
  // installed in the consuming project (process is a Node global, but its
  // *type* declarations are a separate, optional dependency).
  (globalThis as any).process ? ((globalThis as any).process.exitCode = 1) : undefined;
}