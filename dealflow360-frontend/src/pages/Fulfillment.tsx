import { PackageCheck, Truck, Warehouse, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type WarehouseType = {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
};

type Inventory = {
  warehouseId: string;
  warehouseName: string;
  availableQuantity: number;
  reservedQuantity: number;
};

function Fulfillment() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [allocationForm, setAllocationForm] = useState({ dealId: "", warehouseId: "", productId: "", quantity: "" });
  const [inventory, setInventory] = useState<Inventory[]>([]);

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("dealflow360_token");
      if (!token) throw new Error("Session expired. Please log in again.");

      const response = await fetch("http://localhost:5000/api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) setWarehouses(data.data || []);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryLookup = async () => {
    if (!allocationForm.productId) {
      alert("Please enter a Product ID");
      return;
    }
    try {
      const token = localStorage.getItem("dealflow360_token");
      const response = await fetch(`http://localhost:5000/api/products/${allocationForm.productId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) setInventory(data.data || []);
      else alert("Product not found");
    } catch (error) {
      alert("Error fetching inventory: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleAllocate = async () => {
    if (!allocationForm.dealId || !allocationForm.warehouseId || !allocationForm.productId || !allocationForm.quantity) {
      alert("Please fill in all fields");
      return;
    }

    const selectedWarehouse = warehouses.find((w) => w.id === allocationForm.warehouseId);
    if (!selectedWarehouse) {
      alert("Warehouse not found");
      return;
    }

    try {
      const token = localStorage.getItem("dealflow360_token");
      const response = await fetch(`http://localhost:5000/api/deals/${allocationForm.dealId}/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allocations: [
            {
              warehouseId: allocationForm.warehouseId,
              warehouseName: selectedWarehouse.name,
              productId: allocationForm.productId,
              quantity: Number(allocationForm.quantity),
              status: "ALLOCATED",
            },
          ],
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Allocation created successfully!");
        setShowAllocationForm(false);
        setAllocationForm({ dealId: "", warehouseId: "", productId: "", quantity: "" });
        setInventory([]);
      } else {
        alert("Failed to allocate: " + (result.error?.message || "Unknown error"));
      }
    } catch (error) {
      alert("Error allocating: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const pendingFulfillment = 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h1>Warehouse Fulfillment</h1>
          <p>Monitor inventory allocation, shipments, and delivery progress.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <PackageCheck size={20} />
          </div>
          <span>Pending Fulfillment</span>
          <strong>{pendingFulfillment}</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Warehouse size={20} />
          </div>
          <span>Warehouse Allocations</span>
          <strong>0</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={20} />
          </div>
          <span>Active Warehouses</span>
          <strong>{warehouses.length}</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Warehouses</h2>
            <p>{warehouses.length} warehouses available</p>
          </div>
          <button className="primary-button" onClick={() => setShowAllocationForm(!showAllocationForm)}>
            <Plus size={18} />
            Allocate Inventory
          </button>
        </div>

        {showAllocationForm && (
          <div className="form-section" style={{ padding: "20px", borderBottom: "1px solid #e0e0e0" }}>
            <h3>Warehouse Allocation</h3>
            <input
              type="text"
              placeholder="Deal ID"
              value={allocationForm.dealId}
              onChange={(e) => setAllocationForm({ ...allocationForm, dealId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <select
              value={allocationForm.warehouseId}
              onChange={(e) => setAllocationForm({ ...allocationForm, warehouseId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.location})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Product ID"
              value={allocationForm.productId}
              onChange={(e) => setAllocationForm({ ...allocationForm, productId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <button onClick={handleInventoryLookup} style={{ marginBottom: "10px", marginRight: "10px" }}>
              Check Inventory
            </button>
            {inventory.length > 0 && (
              <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f5f5f5" }}>
                <strong>Available Inventory:</strong>
                {inventory.map((inv) => (
                  <div key={inv.warehouseId}>
                    {inv.warehouseName}: {inv.availableQuantity} available
                  </div>
                ))}
              </div>
            )}
            <input
              type="number"
              placeholder="Quantity"
              value={allocationForm.quantity}
              onChange={(e) => setAllocationForm({ ...allocationForm, quantity: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <button onClick={handleAllocate} style={{ marginRight: "10px" }}>
              Allocate
            </button>
            <button onClick={() => setShowAllocationForm(false)}>Cancel</button>
          </div>
        )}

        <div className="table-section" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading warehouses...</p>
          ) : warehouses.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>No warehouses configured</p>
          ) : (
            <table style={{ width: "100%", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>Warehouse ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px" }}>{warehouse.id}</td>
                    <td style={{ padding: "10px" }}>{warehouse.name}</td>
                    <td style={{ padding: "10px" }}>{warehouse.location}</td>
                    <td style={{ padding: "10px" }}>{warehouse.is_active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Fulfillment;