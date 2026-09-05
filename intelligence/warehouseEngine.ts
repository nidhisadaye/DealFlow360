import {
  Deal,
  Inventory,
  Warehouse,
  WarehouseAllocation,
} from "../shared/types";

type AllocationStatus = "ALLOCATED" | "PARTIAL" | "UNAVAILABLE";

/**
 * Sums available inventory for a given warehouse + product pair, defensively
 * handling duplicate inventory records and negative/invalid quantities by
 * clamping each record's contribution to zero or above.
 */
function getAvailableQuantity(
  inventory: Inventory[],
  warehouseId: string,
  productId: string
): number {
  return inventory
    .filter(
      (record) =>
        record.warehouseId === warehouseId &&
        record.productId === productId
    )
    .reduce(
      (sum, record) => sum + Math.max(record.availableQuantity, 0),
      0
    );
}

/**
 * Allocates the required quantity for a single product across active
 * warehouses, in the order the warehouses were supplied, splitting across
 * multiple warehouses when a single warehouse cannot fulfill the full
 * requested amount.
 */
function allocateForItem(
  productId: string,
  requiredQuantity: number,
  inventory: Inventory[],
  activeWarehouses: Warehouse[]
): WarehouseAllocation[] {
  // Nothing to fulfill for a non-positive requested quantity.
  if (requiredQuantity <= 0) {
    return [];
  }

  const allocations: WarehouseAllocation[] = [];
  let remaining = requiredQuantity;

  for (const warehouse of activeWarehouses) {
    if (remaining <= 0) {
      break;
    }

    const available = getAvailableQuantity(
      inventory,
      warehouse.id,
      productId
    );

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

  const totalAllocated = requiredQuantity - remaining;

  if (totalAllocated === 0) {
    // No inventory could be found/used for this product at all.
    const fallbackWarehouse = activeWarehouses[0];

    const unavailable: WarehouseAllocation = fallbackWarehouse
      ? {
          warehouseId: fallbackWarehouse.id,
          warehouseName: fallbackWarehouse.name,
          productId,
          quantity: 0,
          status: "UNAVAILABLE",
        }
      : {
          warehouseId: "UNASSIGNED",
          warehouseName: "Unassigned",
          productId,
          quantity: 0,
          status: "UNAVAILABLE",
        };

    return [unavailable];
  }

  const finalStatus: AllocationStatus =
    totalAllocated >= requiredQuantity ? "ALLOCATED" : "PARTIAL";

  return allocations.map((allocation) => ({
    ...allocation,
    status: finalStatus,
  }));
}

export function allocateWarehouseInventory(
  deal: Deal,
  inventory: Inventory[],
  warehouses: Warehouse[]
): WarehouseAllocation[] {
  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.isActive
  );

  const allAllocations: WarehouseAllocation[] = [];

  for (const item of deal.items) {
    const itemAllocations = allocateForItem(
      item.productId,
      item.quantity,
      inventory,
      activeWarehouses
    );

    allAllocations.push(...itemAllocations);
  }

  return allAllocations;
}