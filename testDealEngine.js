"use strict";
/**
 * Phase 5 test suite for warehouseEngine, plus regression coverage for
 * Phase 1-4 behavior of the surrounding deal-evaluation engines.
 *
 * This is a lightweight, dependency-free assertion runner (no test
 * framework required) so it can run directly under ts-node/node in any
 * environment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const warehouseEngine_1 = require("./intelligence/warehouseEngine");
const discountEngine_1 = require("./intelligence/discountEngine");
const riskEngine_1 = require("./intelligence/riskEngine");
const approvalEngine_1 = require("./intelligence/approvalEngine");
const upsellEngine_1 = require("./intelligence/upsellEngine");
const dealEngine_1 = require("./intelligence/dealEngine");
// ---------------------------------------------------------------------
// Minimal assertion helpers
// ---------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        passed++;
    }
    else {
        failed++;
        failures.push(`${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
    }
}
function assertTrue(condition, label) {
    if (condition) {
        passed++;
    }
    else {
        failed++;
        failures.push(`${label} (expected true, got false)`);
    }
}
// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------
function makeWarehouse(id, name, isActive = true) {
    return { id, name, location: "N/A", isActive, createdAt: "2024-01-01" };
}
function makeInventory(warehouseId, productId, availableQuantity, reservedQuantity = 0) {
    return {
        id: `inv-${warehouseId}-${productId}-${Math.random()}`,
        warehouseId,
        productId,
        availableQuantity,
        reservedQuantity,
        updatedAt: "2024-01-01",
    };
}
function makeDealItem(productId, quantity) {
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
function makeDeal(items) {
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
// =======================================================================
// PHASE 5 — WAREHOUSE ENGINE TESTS
// =======================================================================
// 1. Full allocation from one warehouse
(function test1() {
    const deal = makeDeal([makeDealItem("P1", 10)]);
    const inventory = [makeInventory("W1", "P1", 10)];
    const warehouses = [makeWarehouse("W1", "Warehouse 1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
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
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 2, "Test2: two allocation records");
    assertEqual(result[0].warehouseId, "A", "Test2: A allocated first");
    assertEqual(result[0].quantity, 6, "Test2: A gets 6");
    assertEqual(result[1].warehouseId, "B", "Test2: B allocated second");
    assertEqual(result[1].quantity, 4, "Test2: B gets 4");
    assertTrue(result.every((r) => r.status === "ALLOCATED"), "Test2: both records ALLOCATED");
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
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 3, "Test3: three allocation records");
    assertEqual(result.reduce((sum, r) => sum + r.quantity, 0), 15, "Test3: total allocated equals required");
    assertTrue(result.every((r) => r.status === "ALLOCATED"), "Test3: all ALLOCATED");
})();
// 4. Partial allocation
(function test4() {
    const deal = makeDeal([makeDealItem("P1", 10)]);
    const inventory = [makeInventory("A", "P1", 6), makeInventory("B", "P1", 2)];
    const warehouses = [makeWarehouse("A", "A"), makeWarehouse("B", "B")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 2, "Test4: two allocation records");
    assertTrue(result.every((r) => r.status === "PARTIAL"), "Test4: both PARTIAL");
    assertEqual(result.reduce((sum, r) => sum + r.quantity, 0), 8, "Test4: total allocated is 8 (never phantom)");
})();
// 5. Completely unavailable product
(function test5() {
    const deal = makeDeal([makeDealItem("P1", 10)]);
    const inventory = [makeInventory("A", "P1", 0), makeInventory("B", "P1", 0)];
    const warehouses = [makeWarehouse("A", "A"), makeWarehouse("B", "B")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
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
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test6: single record");
    assertEqual(result[0].status, "UNAVAILABLE", "Test6: status remains UNAVAILABLE");
    assertEqual(result[0].warehouseId, "UNASSIGNED", "Test6: warehouseId UNASSIGNED");
})();
// 7. Zero inventory
(function test7() {
    const deal = makeDeal([makeDealItem("P1", 5)]);
    const inventory = [makeInventory("A", "P1", 0)];
    const warehouses = [makeWarehouse("A", "A")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test7: single record");
    assertEqual(result[0].status, "UNAVAILABLE", "Test7: UNAVAILABLE for zero inventory");
})();
// 8. Negative inventory never increases availability
(function test8() {
    const deal = makeDeal([makeDealItem("P1", 5)]);
    const inventory = [makeInventory("A", "P1", -100)];
    const warehouses = [makeWarehouse("A", "A")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test8: single record");
    assertEqual(result[0].status, "UNAVAILABLE", "Test8: negative inventory treated as none");
    assertTrue(result[0].quantity >= 0, "Test8: quantity never negative");
})();
// 9. Duplicate inventory rows are aggregated, not double-counted as separate warehouses
(function test9() {
    const deal = makeDeal([makeDealItem("P1", 8)]);
    const inventory = [
        makeInventory("A", "P1", 5),
        makeInventory("A", "P1", 5),
    ];
    const warehouses = [makeWarehouse("A", "A")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test9: single allocation record (one warehouse)");
    assertEqual(result[0].quantity, 8, "Test9: allocates required amount from aggregated stock");
    assertEqual(result[0].status, "ALLOCATED", "Test9: ALLOCATED since aggregated stock (10) covers requirement");
})();
// 10. Multiple products evaluated independently
(function test10() {
    const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 20)]);
    const inventory = [
        makeInventory("W1", "A", 10),
        makeInventory("W1", "B", 5),
    ];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
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
    const inventory = [
        makeInventory("W1", "A", 5),
        makeInventory("W1", "B", 3),
    ];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    const forA = result.find((r) => r.productId === "A");
    const forB = result.find((r) => r.productId === "B");
    assertEqual(forA.status, "ALLOCATED", "Test11: A ALLOCATED");
    assertEqual(forB.status, "PARTIAL", "Test11: B PARTIAL");
    assertEqual(forB.quantity, 3, "Test11: B not inflated by A's stock");
})();
// 12. One product full + another unavailable
(function test12() {
    const deal = makeDeal([makeDealItem("A", 5), makeDealItem("B", 5)]);
    const inventory = [
        makeInventory("W1", "A", 5),
        makeInventory("W1", "B", 0),
    ];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    const forA = result.find((r) => r.productId === "A");
    const forB = result.find((r) => r.productId === "B");
    assertEqual(forA.status, "ALLOCATED", "Test12: A ALLOCATED");
    assertEqual(forB.status, "UNAVAILABLE", "Test12: B UNAVAILABLE");
})();
// 13. Inventory greater than required -> never allocate more than required
(function test13() {
    const deal = makeDeal([makeDealItem("A", 10)]);
    const inventory = [makeInventory("W1", "A", 100)];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test13: single record");
    assertEqual(result[0].quantity, 10, "Test13: only required quantity allocated, not all 100");
    assertEqual(result[0].status, "ALLOCATED", "Test13: ALLOCATED");
})();
// 14. Required quantity zero -> no allocation records
(function test14() {
    const deal = makeDeal([makeDealItem("A", 0)]);
    const inventory = [makeInventory("W1", "A", 10)];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 0, "Test14: zero required quantity produces no allocation");
})();
// 15. Negative required quantity -> no allocation, never negative output
(function test15() {
    const deal = makeDeal([makeDealItem("A", -5)]);
    const inventory = [makeInventory("W1", "A", 10)];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 0, "Test15: negative required quantity produces no allocation");
})();
// 16. Invalid/NaN quantity -> handled without crashing, no phantom allocation
(function test16() {
    const deal = makeDeal([makeDealItem("A", NaN)]);
    const inventory = [makeInventory("W1", "A", 10)];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 0, "Test16: NaN quantity produces no allocation");
    assertTrue(result.every((r) => Number.isFinite(r.quantity)), "Test16: no NaN in output");
})();
// 17. Infinity quantity -> handled without crashing, never hangs or produces NaN/Infinity
(function test17() {
    const deal = makeDeal([makeDealItem("A", Infinity)]);
    const inventory = [makeInventory("W1", "A", 10)];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 0, "Test17: Infinity quantity produces no allocation");
    assertTrue(result.every((r) => Number.isFinite(r.quantity)), "Test17: no Infinity in output");
})();
// 18. Invalid inventory quantity (NaN in inventory record) -> treated as unusable, no crash
(function test18() {
    const deal = makeDeal([makeDealItem("A", 5)]);
    const inventory = [
        makeInventory("W1", "A", NaN),
        makeInventory("W2", "A", Infinity),
    ];
    const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test18: single record");
    assertEqual(result[0].status, "UNAVAILABLE", "Test18: invalid inventory treated as zero usable stock");
    assertTrue(result.every((r) => Number.isFinite(r.quantity)), "Test18: no NaN/Infinity in output");
})();
// 19. Multiple warehouses with deterministic ordering
(function test19() {
    const deal = makeDeal([makeDealItem("A", 10)]);
    const inventory = [
        makeInventory("Z", "A", 5),
        makeInventory("A", "A", 5),
    ];
    const warehouses = [makeWarehouse("Z", "Z warehouse"), makeWarehouse("A", "A warehouse")];
    const result1 = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    const result2 = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    // Order follows the order warehouses were supplied in (Z before A here),
    // not alphabetical id order -- and must be identical across calls.
    assertEqual(result1[0].warehouseId, "Z", "Test19: allocation follows supplied warehouse order");
    assertEqual(result1, result2, "Test19: identical result across repeated calls");
})();
// 20. Repeated evaluation of the same deal produces the same result (no hidden state)
(function test20() {
    const deal = makeDeal([makeDealItem("A", 10), makeDealItem("B", 3)]);
    const inventory = [
        makeInventory("W1", "A", 6),
        makeInventory("W2", "A", 6),
        makeInventory("W1", "B", 1),
    ];
    const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];
    const first = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    const second = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(first, second, "Test20: repeated evaluation is stable");
})();
// 21. Empty inventory
(function test21() {
    const deal = makeDeal([makeDealItem("A", 5)]);
    const inventory = [];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test21: single record");
    assertEqual(result[0].status, "UNAVAILABLE", "Test21: UNAVAILABLE with empty inventory");
})();
// 22. Empty warehouse list
(function test22() {
    const deal = makeDeal([makeDealItem("A", 5)]);
    const inventory = [makeInventory("W1", "A", 10)];
    const warehouses = [];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test22: single record");
    assertEqual(result[0].warehouseId, "UNASSIGNED", "Test22: UNASSIGNED with no warehouses at all");
})();
// 23. Large quantities
(function test23() {
    const deal = makeDeal([makeDealItem("A", 5000000)]);
    const inventory = [
        makeInventory("W1", "A", 3000000),
        makeInventory("W2", "A", 3000000),
    ];
    const warehouses = [makeWarehouse("W1", "W1"), makeWarehouse("W2", "W2")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.reduce((sum, r) => sum + r.quantity, 0), 5000000, "Test23: large-quantity allocation totals exactly the requirement");
    assertTrue(result.every((r) => r.status === "ALLOCATED"), "Test23: ALLOCATED for large quantities");
})();
// 24. Mixed valid and invalid inventory rows for the same product
(function test24() {
    const deal = makeDeal([makeDealItem("A", 10)]);
    const inventory = [
        makeInventory("W1", "A", -50),
        makeInventory("W1", "A", 6),
        makeInventory("W1", "A", NaN),
    ];
    const warehouses = [makeWarehouse("W1", "W1")];
    const result = (0, warehouseEngine_1.allocateWarehouseInventory)(deal, inventory, warehouses);
    assertEqual(result.length, 1, "Test24: single record");
    assertEqual(result[0].quantity, 6, "Test24: only the valid 6 units counted as usable");
    assertEqual(result[0].status, "PARTIAL", "Test24: PARTIAL since usable stock is only 6 of 10");
})();
// 25. Regression: existing dealEngine end-to-end orchestration still works
(function test25() {
    const customer = {
        id: "cust-1",
        name: "Acme Co",
        company: "Acme",
        email: "a@acme.com",
        tier: "GOLD",
        isActive: true,
        createdAt: "2024-01-01",
    };
    const product = {
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
    const rule = {
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
    const evaluation = (0, dealEngine_1.evaluateDeal)(deal, customer, [product], [rule], inventory, warehouses);
    assertEqual(evaluation.status, "APPROVED", "Test25: within-limit discount does not require approval");
    assertEqual(evaluation.warehouseAllocation[0].status, "ALLOCATED", "Test25: warehouse allocation still flows through dealEngine");
})();
// 26. Regression: discountEngine / riskEngine / approvalEngine / upsellEngine untouched behavior
(function test26() {
    const customer = {
        id: "cust-1",
        name: "Acme Co",
        company: "Acme",
        email: "a@acme.com",
        tier: "SILVER",
        isActive: true,
        createdAt: "2024-01-01",
    };
    const product = {
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
    const rule = {
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
    const { evaluation: discountEvaluation } = (0, discountEngine_1.evaluateDiscount)(deal, customer, [product], [rule]);
    assertTrue(discountEvaluation.exceeded, "Test26: discount exceeded flag still works");
    const riskEvaluation = (0, riskEngine_1.evaluateRisk)(deal, discountEvaluation, []);
    assertTrue(riskEvaluation.riskScore > 0, "Test26: risk engine still scores risk");
    const approval = (0, approvalEngine_1.determineApproval)(discountEvaluation, riskEvaluation, deal.marginPercent);
    assertTrue(approval.required, "Test26: negative margin + exceeded discount requires approval");
    const upsells = (0, upsellEngine_1.generateUpsellRecommendations)(deal, [
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
// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------
console.log(`\nPassed: ${passed}, Failed: ${failed}`);
if (failures.length > 0) {
    console.log("\nFailures:\n" + failures.join("\n\n"));
    // Signal failure to the caller without depending on @types/node being
    // installed in the consuming project (process is a Node global, but its
    // *type* declarations are a separate, optional dependency).
    globalThis.process ? (globalThis.process.exitCode = 1) : undefined;
}