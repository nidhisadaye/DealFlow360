import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  tier: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  sale_price: number;
  cost_price: number;
  billing_type: string;
};

type DealItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  billingType: string;
  subtotal: number;
};

function DealBuilder({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");

  const [items, setItems] = useState<DealItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("dealflow360_token");
      if (!token) throw new Error("Session expired. Please log in again.");

      const [customersRes, productsRes] = await Promise.all([
        fetch("http://localhost:5000/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      if (customersData.success) setCustomers(customersData.data || []);
      if (productsData.success) setProducts(productsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      setError("Please select a product and enter quantity");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      setError("Product not found");
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    const subtotal = product.sale_price * qty;

    const newItem: DealItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.sale_price,
      unitCost: product.cost_price,
      billingType: product.billing_type,
      subtotal,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity("1");
    setError("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateDeal = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!title || !selectedCustomer || items.length === 0) {
      setError("Please fill in title, select customer, and add at least one item");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("dealflow360_token");

      const response = await fetch("http://localhost:5000/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          title,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          discountPercent: Number(discountPercent) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const evaluationResponse = await fetch(`http://localhost:5000/api/deals/${result.data.id}/evaluate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const evaluation = await evaluationResponse.json();
        if (!evaluationResponse.ok || !evaluation.success) {
          throw new Error(evaluation.error?.message || "Deal was created, but intelligence evaluation failed.");
        }
        setSuccess(`Deal ${result.data.id} created and evaluated: ${evaluation.data.status.replaceAll("_", " ")}.`);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(result.error?.message || "Failed to create deal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = (subtotal * Number(discountPercent)) / 100;
  const total = subtotal - discountAmount;
  const costAmount = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const margin = total - costAmount;
  const marginPercent = total > 0 ? (margin / total) * 100 : 0;

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: "center", padding: "40px" }}>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: "#666",
              padding: "0",
              fontSize: "14px",
            }}
          >
            <ArrowLeft size={18} /> Back to Deals
          </button>
          <h1>Create New Deal</h1>
          <p>Build a quotation by selecting products and quantities</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c00",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#efe",
            color: "#060",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {success}
        </div>
      )}

      <div className="content-card">
        <div style={{ marginBottom: "30px" }}>
          <h3>Deal Information</h3>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Deal Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Q4 Enterprise Package"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Customer *
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">-- Select a customer --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.company} ({customer.tier})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <h3>Add Products</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                Product *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                <option value="">-- Select product --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (₹{product.sale_price.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                Unit Price
              </label>
              <input
                type="text"
                disabled
                value={selectedProduct ? `₹${products.find((p) => p.id === selectedProduct)?.sale_price.toLocaleString("en-IN") || ""}` : ""}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                  background: "#f5f5f5",
                }}
              />
            </div>

            <button
              onClick={handleAddItem}
              style={{
                padding: "8px 16px",
                background: "#0052cc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "23px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div style={{ marginBottom: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <h3>Deal Items</h3>

            <table style={{ width: "100%", fontSize: "13px", marginBottom: "20px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>Product</th>
                  <th style={{ textAlign: "center", padding: "10px" }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "10px" }}>Unit Price</th>
                  <th style={{ textAlign: "right", padding: "10px" }}>Subtotal</th>
                  <th style={{ textAlign: "center", padding: "10px" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{item.productName}</td>
                    <td style={{ textAlign: "center", padding: "10px" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>
                      ₹{item.unitPrice.toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold" }}>
                      ₹{item.subtotal.toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c00",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Discount Percent (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                style={{
                  width: "150px",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                background: "#f9f9f9",
                padding: "20px",
                borderRadius: "4px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal:</span>
                    <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span>Discount ({discountPercent}%):</span>
                    <strong style={{ color: "#c00" }}>-₹{discountAmount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "16px",
                      fontWeight: "bold",
                      borderTop: "1px solid #ddd",
                      paddingTop: "10px",
                    }}
                  >
                    <span>Total Amount:</span>
                    <strong>₹{total.toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span>Cost Amount:</span>
                    <strong>₹{costAmount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span>Margin:</span>
                    <strong style={{ color: margin >= 0 ? "#060" : "#c00" }}>
                      ₹{margin.toLocaleString("en-IN")} ({marginPercent.toFixed(2)}%)
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#666",
                      borderTop: "1px solid #ddd",
                      paddingTop: "10px",
                    }}
                  >
                    <span>Items Count:</span>
                    <strong>{items.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={onBack}
                disabled={submitting}
                style={{
                  padding: "10px 20px",
                  background: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateDeal}
                disabled={submitting}
                style={{
                  padding: "10px 24px",
                  background: "#0052cc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealBuilder;
