"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dealEngine_1 = require("./intelligence/dealEngine");
// ============================================================
// SHARED TEST DATA
// ============================================================
const customer = {
    id: "CUST-001",
    name: "Acme Corp",
    company: "Acme Corporation",
    email: "contact@acme.com",
    tier: "GOLD",
    isActive: true,
    createdAt: new Date().toISOString(),
};
const products = [
    {
        id: "PROD-HW-001",
        name: "Enterprise Laptop",
        description: "High-performance business laptop",
        category: "Hardware",
        type: "GOOD",
        billingType: "ONE_TIME",
        salePrice: 100000,
        costPrice: 70000,
        currency: "INR",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "PROD-WAR-001",
        name: "Extended Warranty",
        description: "Three-year extended warranty",
        category: "Services",
        type: "SERVICE",
        billingType: "ONE_TIME",
        salePrice: 10000,
        costPrice: 4000,
        currency: "INR",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "PROD-MAINT-001",
        name: "Maintenance Service",
        description: "Annual maintenance package",
        category: "Services",
        type: "SERVICE",
        billingType: "RECURRING",
        salePrice: 15000,
        costPrice: 6000,
        currency: "INR",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
];
const rules = [
    {
        id: "RULE-GOLD",
        name: "Gold Customer Limit",
        customerTier: "GOLD",
        maxDiscountPercent: 15,
        requiresApprovalAbove: 15,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "RULE-HARDWARE",
        name: "Hardware Discount Limit",
        productCategory: "Hardware",
        maxDiscountPercent: 15,
        requiresApprovalAbove: 15,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
const warehouses = [
    {
        id: "WH-MUM",
        name: "Mumbai Warehouse",
        location: "Mumbai",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "WH-PUN",
        name: "Pune Warehouse",
        location: "Pune",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
];
// ============================================================
// SCENARIO 1 — RISKY DEAL
// ============================================================
console.log("\n========================================");
console.log("SCENARIO 1 — RISKY DEAL");
console.log("========================================\n");
const riskyDeal = {
    id: "DEAL-001",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Enterprise Laptop Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-001",
            dealId: "DEAL-001",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 10,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 18,
            subtotal: 1000000,
            total: 820000,
        },
    ],
    discountPercent: 18,
    subtotal: 1000000,
    discountAmount: 180000,
    totalAmount: 820000,
    costAmount: 700000,
    marginAmount: 120000,
    marginPercent: 14.63,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const riskyInventory = [
    {
        id: "INV-001",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 6,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "INV-002",
        warehouseId: "WH-PUN",
        productId: "PROD-HW-001",
        availableQuantity: 2,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const riskyResult = (0, dealEngine_1.evaluateDeal)(riskyDeal, customer, products, rules, riskyInventory, warehouses);
console.log(JSON.stringify(riskyResult, null, 2));
console.log("\n---------- SCENARIO 1 RESULTS ----------\n");
console.log("Deal ID:", riskyResult.dealId);
console.log("Status:", riskyResult.status);
console.log("Risk Score:", riskyResult.riskScore);
console.log("Risk Level:", riskyResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", riskyResult.discount.requested + "%");
console.log("Allowed:", riskyResult.discount.allowed + "%");
console.log("Exceeded:", riskyResult.discount.exceeded);
console.log("Excess:", riskyResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", riskyResult.approval.required);
console.log("Reason:", riskyResult.approval.reason);
console.log("\nUpsells:");
console.log(riskyResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(riskyResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(riskyResult.warnings);
// ============================================================
// SCENARIO 2 — HEALTHY DEAL
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 2 — HEALTHY DEAL");
console.log("========================================\n");
const healthyDeal = {
    id: "DEAL-002",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Standard Hardware Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-002",
            dealId: "DEAL-002",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 5,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 10,
            subtotal: 500000,
            total: 450000,
        },
    ],
    discountPercent: 10,
    subtotal: 500000,
    discountAmount: 50000,
    totalAmount: 450000,
    costAmount: 350000,
    marginAmount: 100000,
    marginPercent: 22.22,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const healthyInventory = [
    {
        id: "INV-003",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 10,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const healthyResult = (0, dealEngine_1.evaluateDeal)(healthyDeal, customer, products, rules, healthyInventory, warehouses);
console.log(JSON.stringify(healthyResult, null, 2));
console.log("\n---------- SCENARIO 2 RESULTS ----------\n");
console.log("Deal ID:", healthyResult.dealId);
console.log("Status:", healthyResult.status);
console.log("Risk Score:", healthyResult.riskScore);
console.log("Risk Level:", healthyResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", healthyResult.discount.requested + "%");
console.log("Allowed:", healthyResult.discount.allowed + "%");
console.log("Exceeded:", healthyResult.discount.exceeded);
console.log("Excess:", healthyResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", healthyResult.approval.required);
console.log("Reason:", healthyResult.approval.reason);
console.log("\nUpsells:");
console.log(healthyResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(healthyResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(healthyResult.warnings);
// ============================================================
// EXPECTED BUSINESS OUTCOMES
// ============================================================
console.log("\n\n========================================");
console.log("EXPECTED OUTCOMES");
console.log("========================================\n");
console.log("Scenario 1:");
console.log("Expected Status: APPROVAL_REQUIRED");
console.log("Expected Risk: HIGH");
console.log("Expected Approval: true");
console.log("Expected Approver: SALES_MANAGER");
console.log("Expected Discount: 18% requested / 15% allowed");
console.log("Expected Warehouse: PARTIAL");
console.log("\nScenario 2:");
console.log("Expected Status: APPROVED");
console.log("Expected Risk: LOW");
console.log("Expected Approval: false");
console.log("Expected Warehouse: ALLOCATED");
// ============================================================
// SCENARIO 3 — NEGATIVE MARGIN
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 3 — NEGATIVE MARGIN");
console.log("========================================\n");
const negativeMarginDeal = {
    id: "DEAL-003",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Negative Margin Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-003",
            dealId: "DEAL-003",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 5,
            unitPrice: 100000,
            unitCost: 120000,
            billingType: "ONE_TIME",
            discountPercent: 10,
            subtotal: 500000,
            total: 450000,
        },
    ],
    discountPercent: 10,
    subtotal: 500000,
    discountAmount: 50000,
    totalAmount: 450000,
    costAmount: 600000,
    marginAmount: -150000,
    marginPercent: -33.33,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const negativeMarginInventory = [
    {
        id: "INV-004",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 10,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const negativeMarginResult = (0, dealEngine_1.evaluateDeal)(negativeMarginDeal, customer, products, rules, negativeMarginInventory, warehouses);
console.log(JSON.stringify(negativeMarginResult, null, 2));
console.log("\n---------- SCENARIO 3 RESULTS ----------\n");
console.log("Deal ID:", negativeMarginResult.dealId);
console.log("Status:", negativeMarginResult.status);
console.log("Risk Score:", negativeMarginResult.riskScore);
console.log("Risk Level:", negativeMarginResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", negativeMarginResult.discount.requested + "%");
console.log("Allowed:", negativeMarginResult.discount.allowed + "%");
console.log("Exceeded:", negativeMarginResult.discount.exceeded);
console.log("Excess:", negativeMarginResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", negativeMarginResult.approval.required);
console.log("Reason:", negativeMarginResult.approval.reason);
console.log("\nUpsells:");
console.log(negativeMarginResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(negativeMarginResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(negativeMarginResult.warnings);
// ============================================================
// SCENARIO 4 — ZERO INVENTORY
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 4 — ZERO INVENTORY");
console.log("========================================\n");
const zeroInventoryDeal = {
    id: "DEAL-004",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Zero Inventory Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-004",
            dealId: "DEAL-004",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 5,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 10,
            subtotal: 500000,
            total: 450000,
        },
    ],
    discountPercent: 10,
    subtotal: 500000,
    discountAmount: 50000,
    totalAmount: 450000,
    costAmount: 350000,
    marginAmount: 100000,
    marginPercent: 22.22,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const zeroInventory = [
    {
        id: "INV-005",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 0,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const zeroInventoryResult = (0, dealEngine_1.evaluateDeal)(zeroInventoryDeal, customer, products, rules, zeroInventory, warehouses);
console.log(JSON.stringify(zeroInventoryResult, null, 2));
console.log("\n---------- SCENARIO 4 RESULTS ----------\n");
console.log("Deal ID:", zeroInventoryResult.dealId);
console.log("Status:", zeroInventoryResult.status);
console.log("Risk Score:", zeroInventoryResult.riskScore);
console.log("Risk Level:", zeroInventoryResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", zeroInventoryResult.discount.requested + "%");
console.log("Allowed:", zeroInventoryResult.discount.allowed + "%");
console.log("Exceeded:", zeroInventoryResult.discount.exceeded);
console.log("Excess:", zeroInventoryResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", zeroInventoryResult.approval.required);
console.log("Reason:", zeroInventoryResult.approval.reason);
console.log("\nUpsells:");
console.log(zeroInventoryResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(zeroInventoryResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(zeroInventoryResult.warnings);
// ============================================================
// SCENARIO 5 — NO ACTIVE WAREHOUSES
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 5 — NO ACTIVE WAREHOUSES");
console.log("========================================\n");
const noActiveWarehousesDeal = {
    id: "DEAL-005",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme No Active Warehouses Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-005",
            dealId: "DEAL-005",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 5,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 10,
            subtotal: 500000,
            total: 450000,
        },
    ],
    discountPercent: 10,
    subtotal: 500000,
    discountAmount: 50000,
    totalAmount: 450000,
    costAmount: 350000,
    marginAmount: 100000,
    marginPercent: 22.22,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const noActiveWarehousesInventory = [
    {
        id: "INV-006",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 10,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const noActiveWarehouses = [
    {
        id: "WH-MUM",
        name: "Mumbai Warehouse",
        location: "Mumbai",
        isActive: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: "WH-PUN",
        name: "Pune Warehouse",
        location: "Pune",
        isActive: false,
        createdAt: new Date().toISOString(),
    },
];
const noActiveWarehousesResult = (0, dealEngine_1.evaluateDeal)(noActiveWarehousesDeal, customer, products, rules, noActiveWarehousesInventory, noActiveWarehouses);
console.log(JSON.stringify(noActiveWarehousesResult, null, 2));
console.log("\n---------- SCENARIO 5 RESULTS ----------\n");
console.log("Deal ID:", noActiveWarehousesResult.dealId);
console.log("Status:", noActiveWarehousesResult.status);
console.log("Risk Score:", noActiveWarehousesResult.riskScore);
console.log("Risk Level:", noActiveWarehousesResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", noActiveWarehousesResult.discount.requested + "%");
console.log("Allowed:", noActiveWarehousesResult.discount.allowed + "%");
console.log("Exceeded:", noActiveWarehousesResult.discount.exceeded);
console.log("Excess:", noActiveWarehousesResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", noActiveWarehousesResult.approval.required);
console.log("Reason:", noActiveWarehousesResult.approval.reason);
console.log("\nUpsells:");
console.log(noActiveWarehousesResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(noActiveWarehousesResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(noActiveWarehousesResult.warnings);
// ============================================================
// SCENARIO 6 — MISSING CUSTOMER-TIER RULE
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 6 — MISSING CUSTOMER-TIER RULE");
console.log("========================================\n");
const missingTierRules = [
    {
        id: "RULE-HARDWARE",
        name: "Hardware Discount Limit",
        productCategory: "Hardware",
        maxDiscountPercent: 15,
        requiresApprovalAbove: 15,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
const missingTierDeal = {
    id: "DEAL-006",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Missing Tier Rule Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-006",
            dealId: "DEAL-006",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 5,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 10,
            subtotal: 500000,
            total: 450000,
        },
    ],
    discountPercent: 10,
    subtotal: 500000,
    discountAmount: 50000,
    totalAmount: 450000,
    costAmount: 350000,
    marginAmount: 100000,
    marginPercent: 22.22,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const missingTierInventory = [
    {
        id: "INV-007",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 10,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
const missingTierResult = (0, dealEngine_1.evaluateDeal)(missingTierDeal, customer, products, missingTierRules, missingTierInventory, warehouses);
console.log(JSON.stringify(missingTierResult, null, 2));
console.log("\n---------- SCENARIO 6 RESULTS ----------\n");
console.log("Deal ID:", missingTierResult.dealId);
console.log("Status:", missingTierResult.status);
console.log("Risk Score:", missingTierResult.riskScore);
console.log("Risk Level:", missingTierResult.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", missingTierResult.discount.requested + "%");
console.log("Allowed:", missingTierResult.discount.allowed + "%");
console.log("Exceeded:", missingTierResult.discount.exceeded);
console.log("Excess:", missingTierResult.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", missingTierResult.approval.required);
console.log("Reason:", missingTierResult.approval.reason);
console.log("\nUpsells:");
console.log(missingTierResult.upsells);
console.log("\nWarehouse Allocation:");
console.log(missingTierResult.warehouseAllocation);
console.log("\nWarnings:");
console.log(missingTierResult.warnings);
// ============================================================
// EXPECTED OUTCOMES — SCENARIOS 3-6
// ============================================================
console.log("\n\n========================================");
console.log("EXPECTED OUTCOMES (SCENARIOS 3-6)");
console.log("========================================\n");
console.log("Scenario 3 (Negative Margin):");
console.log("Expected Status: APPROVED");
console.log("Expected Risk: MEDIUM");
console.log("Expected Approval: false");
console.log("Expected Discount: 10% requested / 15% allowed");
console.log("\nScenario 4 (Zero Inventory):");
console.log("Expected Status: APPROVED");
console.log("Expected Risk: MEDIUM");
console.log("Expected Approval: false");
console.log("Expected Warehouse: UNAVAILABLE, quantity 0");
console.log("\nScenario 5 (No Active Warehouses):");
console.log("Expected Status: APPROVED");
console.log("Expected Risk: LOW");
console.log("Expected Approval: false");
console.log("Expected Warehouse: UNASSIGNED / Unassigned, quantity 0, UNAVAILABLE");
console.log("\nScenario 6 (Missing Customer-Tier Rule):");
console.log("Expected Status: APPROVAL_REQUIRED");
console.log("Expected Risk: MEDIUM");
console.log("Expected Approval: true");
console.log("Expected Discount: 10% requested / 0% allowed");
// ============================================================
// SCENARIO 7 — RE-EVALUATION AFTER DISCOUNT CHANGE
// ============================================================
console.log("\n\n========================================");
console.log("SCENARIO 7 — RE-EVALUATION AFTER DISCOUNT CHANGE");
console.log("========================================\n");
const initialDeal = {
    id: "DEAL-007",
    customerId: "CUST-001",
    salesRepId: "USER-001",
    title: "Acme Re-Evaluation Deal",
    status: "UNDER_REVIEW",
    items: [
        {
            id: "ITEM-007",
            dealId: "DEAL-007",
            productId: "PROD-HW-001",
            productName: "Enterprise Laptop",
            quantity: 10,
            unitPrice: 100000,
            unitCost: 70000,
            billingType: "ONE_TIME",
            discountPercent: 18,
            subtotal: 1000000,
            total: 820000,
        },
    ],
    discountPercent: 18,
    subtotal: 1000000,
    discountAmount: 180000,
    totalAmount: 820000,
    costAmount: 700000,
    marginAmount: 120000,
    marginPercent: 14.63,
    riskScore: 0,
    riskLevel: "LOW",
    currency: "INR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const reevaluationInventory = [
    {
        id: "INV-008",
        warehouseId: "WH-MUM",
        productId: "PROD-HW-001",
        availableQuantity: 6,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "INV-009",
        warehouseId: "WH-PUN",
        productId: "PROD-HW-001",
        availableQuantity: 2,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
    },
];
// ---------- STEP 1 — INITIAL EVALUATION ----------
const initialEvaluation = (0, dealEngine_1.evaluateDeal)(initialDeal, customer, products, rules, reevaluationInventory, warehouses);
console.log("---------- INITIAL EVALUATION (FULL) ----------\n");
console.log(JSON.stringify(initialEvaluation, null, 2));
console.log("\n---------- INITIAL EVALUATION RESULTS ----------\n");
console.log("Deal ID:", initialEvaluation.dealId);
console.log("Status:", initialEvaluation.status);
console.log("Risk Score:", initialEvaluation.riskScore);
console.log("Risk Level:", initialEvaluation.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", initialEvaluation.discount.requested + "%");
console.log("Allowed:", initialEvaluation.discount.allowed + "%");
console.log("Exceeded:", initialEvaluation.discount.exceeded);
console.log("Excess:", initialEvaluation.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", initialEvaluation.approval.required);
console.log("Reason:", initialEvaluation.approval.reason);
// ---------- STEP 2 — MODIFY THE DEAL (NEW OBJECT, ORIGINAL NOT MUTATED) ----------
const updatedDeal = {
    ...initialDeal,
    items: initialDeal.items.map((item) => ({
        ...item,
        discountPercent: 10,
        total: 900000,
    })),
    discountPercent: 10,
    subtotal: 1000000,
    discountAmount: 100000,
    totalAmount: 900000,
    costAmount: 700000,
    marginAmount: 200000,
    marginPercent: 22.22,
};
// ---------- STEP 3 — RE-EVALUATE USING THE SAME evaluateDeal() ----------
const reevaluatedEvaluation = (0, dealEngine_1.evaluateDeal)(updatedDeal, customer, products, rules, reevaluationInventory, warehouses);
console.log("\n\n---------- RE-EVALUATED (FULL) ----------\n");
console.log(JSON.stringify(reevaluatedEvaluation, null, 2));
console.log("\n---------- RE-EVALUATED RESULTS ----------\n");
console.log("Deal ID:", reevaluatedEvaluation.dealId);
console.log("Status:", reevaluatedEvaluation.status);
console.log("Risk Score:", reevaluatedEvaluation.riskScore);
console.log("Risk Level:", reevaluatedEvaluation.riskLevel);
console.log("\nDiscount:");
console.log("Requested:", reevaluatedEvaluation.discount.requested + "%");
console.log("Allowed:", reevaluatedEvaluation.discount.allowed + "%");
console.log("Exceeded:", reevaluatedEvaluation.discount.exceeded);
console.log("Excess:", reevaluatedEvaluation.discount.excessPercent + "%");
console.log("\nApproval:");
console.log("Required:", reevaluatedEvaluation.approval.required);
console.log("Reason:", reevaluatedEvaluation.approval.reason);
console.log("\nWarehouse Allocation:");
console.log(reevaluatedEvaluation.warehouseAllocation);
// ---------- STEP 4 — EXPLICITLY PROVE THE STATE CHANGED ----------
console.log("\n\n---------- STATE COMPARISON ----------\n");
console.log("INITIAL EVALUATION:");
console.log("Discount:", initialEvaluation.discount);
console.log("Risk Score:", initialEvaluation.riskScore);
console.log("Risk Level:", initialEvaluation.riskLevel);
console.log("Status:", initialEvaluation.status);
console.log("Approval Required:", initialEvaluation.approval.required);
console.log("\nRE-EVALUATED:");
console.log("Discount:", reevaluatedEvaluation.discount);
console.log("Risk Score:", reevaluatedEvaluation.riskScore);
console.log("Risk Level:", reevaluatedEvaluation.riskLevel);
console.log("Status:", reevaluatedEvaluation.status);
console.log("Approval Required:", reevaluatedEvaluation.approval.required);
console.log("\nCHECKS:");
console.log(`Discount changed from ${initialDeal.discountPercent}% to ${updatedDeal.discountPercent}%`);
console.log("Initial discount exceeded =", initialEvaluation.discount.exceeded);
console.log("Re-evaluated discount exceeded =", reevaluatedEvaluation.discount.exceeded);
console.log("Initial status =", initialEvaluation.status);
console.log("Re-evaluated status =", reevaluatedEvaluation.status);
console.log("Initial approval required =", initialEvaluation.approval.required);
console.log("Re-evaluated approval required =", reevaluatedEvaluation.approval.required);
// ============================================================
// EXPECTED OUTCOMES — SCENARIO 7
// ============================================================
console.log("\n\n========================================");
console.log("EXPECTED OUTCOMES (SCENARIO 7)");
console.log("========================================\n");
console.log("Initial Evaluation:");
console.log("Expected Status: APPROVAL_REQUIRED");
console.log("Expected Risk Score: 64");
console.log("Expected Risk Level: HIGH");
console.log("Expected Discount: 18% requested / 15% allowed, exceeded=true, excess=3%");
console.log("Expected Approval Required: true");
console.log("\nRe-Evaluated (after discountPercent 18 -> 10):");
console.log("Expected Discount: 10% requested / 15% allowed, exceeded=false, excess=0%");
console.log("Expected Inventory Risk: 15 (10 requested, 8 available)");
console.log("Expected Status: APPROVED");
console.log("Expected Approval Required: false");
console.log("Expected Warehouse Allocation: Mumbai 6 + Pune 2 = 8 total, status PARTIAL");
