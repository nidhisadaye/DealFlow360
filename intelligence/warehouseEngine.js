"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateWarehouseInventory = allocateWarehouseInventory;
const UNASSIGNED_WAREHOUSE_ID = "UNASSIGNED";
const UNASSIGNED_WAREHOUSE_NAME = "Unassigned";
/**
 * Sanitizes a single inventory record's `availableQuantity` into a usable,
 * non-negative, finite contribution.
 *
 * - Negative values never increase usable stock (clamped to 0).
 * - NaN/Infinity/-Infinity (corrupted upstream data) can never propagate
 *   into the allocation math, so they are treated as zero usable stock —
 *   the conservative choice: we can never prove phantom/unknown inventory
 *   is actually there to allocate.
 */
function sanitizeAvailableQuantity(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(value, 0);
}
/**
 * Sums usable inventory for a given warehouse + product pair. Multiple
 * inventory rows for the same warehouse/product pair (duplicates, or
 * legitimately separate lots/batches represented as separate rows) are
 * aggregated into a single usable total rather than being treated as
 * independent warehouses — a warehouse's real capacity is the sum of all
 * of its records for that product, never more.
 */
function getAvailableQuantity(inventory, warehouseId, productId) {
    return inventory
        .filter((record) => record &&
        record.warehouseId === warehouseId &&
        record.productId === productId)
        .reduce((sum, record) => sum + sanitizeAvailableQuantity(record.availableQuantity), 0);
}
/**
 * Validates that a deal item's productId is usable for lookup. A missing
 * or non-string productId cannot be matched against any inventory record,
 * so it is never a real allocation target — attempting to allocate for it
 * would only ever produce a meaningless UNAVAILABLE placeholder.
 */
function isValidProductId(productId) {
    return typeof productId === "string" && productId.length > 0;
}
/**
 * Normalizes a requested quantity into either a positive, finite number to
 * fulfill, or `null` when there is nothing valid to fulfill.
 *
 * `null` covers every case where allocating would mean inventing
 * fulfillment rather than reporting it: zero or negative quantities (there
 * is nothing to fulfill), and non-finite quantities such as NaN or
 * Infinity (corrupted upstream data — an infinite or undefined requirement
 * can never be deterministically satisfied, so no allocation is
 * attempted). This mirrors the existing engine's treatment of
 * `requiredQuantity <= 0`, extended to also cover invalid numeric input.
 */
function getSafeRequiredQuantity(requiredQuantity) {
    if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
        return null;
    }
    return requiredQuantity;
}
function buildUnavailableAllocation(productId, activeWarehouses) {
    // Deterministic ordering: activeWarehouses preserves the order the
    // caller supplied `warehouses` in, so the "representative" warehouse
    // reported for an unfulfillable product is always the same for the same
    // input — no reliance on random or unstable iteration order.
    const fallbackWarehouse = activeWarehouses[0];
    if (fallbackWarehouse) {
        return {
            warehouseId: fallbackWarehouse.id,
            warehouseName: fallbackWarehouse.name,
            productId,
            quantity: 0,
            status: "UNAVAILABLE",
        };
    }
    // No active warehouses at all: preserve the existing UNASSIGNED
    // convention rather than reinterpreting it as UNAVAILABLE.
    return {
        warehouseId: UNASSIGNED_WAREHOUSE_ID,
        warehouseName: UNASSIGNED_WAREHOUSE_NAME,
        productId,
        quantity: 0,
        status: "UNAVAILABLE",
    };
}
/**
 * Allocates the required quantity for a single product across active
 * warehouses, in the order the warehouses were supplied (deterministic,
 * stable across repeated calls with the same input), splitting across
 * multiple warehouses when a single warehouse cannot fulfill the full
 * requested amount.
 *
 * Invariants maintained regardless of how malformed the inputs are:
 *   - allocated quantity per warehouse is never negative, NaN, or Infinity
 *   - the sum allocated for a product never exceeds what was required
 *   - the sum allocated for a product never exceeds what was actually
 *     available (no phantom inventory)
 */
function allocateForItem(productId, requiredQuantity, inventory, activeWarehouses) {
    if (!isValidProductId(productId)) {
        return [];
    }
    const safeRequiredQuantity = getSafeRequiredQuantity(requiredQuantity);
    if (safeRequiredQuantity === null) {
        return [];
    }
    const allocations = [];
    let remaining = safeRequiredQuantity;
    for (const warehouse of activeWarehouses) {
        if (remaining <= 0) {
            break;
        }
        if (!warehouse || typeof warehouse.id !== "string") {
            continue;
        }
        const available = getAvailableQuantity(inventory, warehouse.id, productId);
        if (available <= 0) {
            continue;
        }
        const allocatedQuantity = Math.min(available, remaining);
        allocations.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            productId,
            quantity: allocatedQuantity,
            // Status is finalized once the total allocated quantity is known.
            status: "ALLOCATED",
        });
        remaining -= allocatedQuantity;
    }
    const totalAllocated = safeRequiredQuantity - remaining;
    if (totalAllocated === 0) {
        // No inventory could be found/used for this product at all.
        return [buildUnavailableAllocation(productId, activeWarehouses)];
    }
    const finalStatus = totalAllocated >= safeRequiredQuantity ? "ALLOCATED" : "PARTIAL";
    return allocations.map((allocation) => ({
        ...allocation,
        status: finalStatus,
    }));
}
/**
 * Determines fulfillment feasibility for every item on a deal.
 *
 * Each deal item is evaluated independently against the full inventory
 * and warehouse set — one product's availability (or lack of it) never
 * affects another product's allocation, and inventory is never shared
 * or double-counted across items. The function is a pure transformation
 * of its inputs (deal/inventory/warehouses are never mutated), so calling
 * it twice with identical input always yields an equivalent result, and
 * re-evaluating after the deal changes always reflects the current items
 * only — nothing is cached between calls.
 */
function allocateWarehouseInventory(deal, inventory, warehouses) {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
    const items = Array.isArray(deal?.items) ? deal.items : [];
    const activeWarehouses = safeWarehouses.filter((warehouse) => warehouse && warehouse.isActive);
    const allAllocations = [];
    for (const item of items) {
        if (!item) {
            continue;
        }
        const itemAllocations = allocateForItem(item.productId, item.quantity, safeInventory, activeWarehouses);
        allAllocations.push(...itemAllocations);
    }
    return allAllocations;
}