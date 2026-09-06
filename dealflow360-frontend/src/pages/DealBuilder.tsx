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

type Evaluation = {
  status: string;
  riskScore: number;
  riskLevel: string;
  approval?: { required: boolean; reason?: string };
  discount?: { requested: number; allowed: number; exceeded: boolean };
  upsells?: Array<{ productName?: string; reason?: string }>;
  warnings?: string[];
};

function DealBuilder({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", company: "", email: "", tier: "BRONZE" });
  const [productForm, setProductForm] = useState({ name: "", category: "Hardware", salePrice: "", costPrice: "", billingType: "ONE_TIME" });
  const [quantity, setQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");

  const [items, setItems] = useState<DealItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
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
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number");
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

  const addCustomer = async () => {
    const token = localStorage.getItem("dealflow360_token");
    const response = await fetch("http://localhost:5000/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(customerForm),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to add customer.");
    setCustomers((current) => [...current, result.data]);
    setSelectedCustomer(result.data.id);
    setCustomerForm({ name: "", company: "", email: "", tier: "BRONZE" });
    setShowCustomerForm(false);
  };

  const addProduct = async () => {
    const token = localStorage.getItem("dealflow360_token");
    const response = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: productForm.name,
        category: productForm.category,
        type: productForm.billingType === "RECURRING" ? "SERVICE" : "GOOD",
        billing_type: productForm.billingType,
        sale_price: Number(productForm.salePrice),
        cost_price: Number(productForm.costPrice),
        currency: "INR",
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to add product.");
    setProducts((current) => [...current, result.data]);
    setSelectedProduct(result.data.id);
    setProductForm({ name: "", category: "Hardware", salePrice: "", costPrice: "", billingType: "ONE_TIME" });
    setShowProductForm(false);
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

    const normalizedDiscount = Number(discountPercent);
    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > 100) {
      setError("Discount must be between 0 and 100%.");
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
          discountPercent: normalizedDiscount,
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
        setEvaluation(evaluation.data);
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
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="form-success" role="status">
          {success}
        </div>
      )}

      {evaluation && (
        <div className="evaluation-note" style={{ marginBottom: "20px" }}>
          <strong>Deal intelligence:</strong>{" "}
          Risk {evaluation.riskLevel} ({Number(evaluation.riskScore || 0)}/100) ·{" "}
          {evaluation.approval?.required ? "Approval required" : "No approval required"}
          {evaluation.discount?.exceeded ? ` · Discount exceeds allowed ${evaluation.discount.allowed}%` : ""}
          {evaluation.upsells?.length ? ` · ${evaluation.upsells.length} upsell suggestion(s)` : ""}
          {evaluation.warnings?.length ? (
            <div style={{ marginTop: "6px" }}>{evaluation.warnings.join(" ")}</div>
          ) : null}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <label style={{ fontWeight: "bold" }}>Customer *</label>
              <button type="button" className="link-button" onClick={() => setShowCustomerForm((current) => !current)}>+ Add customer</button>
            </div>
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
            {showCustomerForm && (
              <div className="inline-create-form">
                <input placeholder="Customer name" value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} />
                <input placeholder="Company" value={customerForm.company} onChange={(event) => setCustomerForm({ ...customerForm, company: event.target.value })} />
                <input type="email" placeholder="Email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} />
                <select value={customerForm.tier} onChange={(event) => setCustomerForm({ ...customerForm, tier: event.target.value })}><option value="BRONZE">Bronze</option><option value="SILVER">Silver</option><option value="GOLD">Gold</option></select>
                <button type="button" className="primary-button" onClick={() => addCustomer().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to add customer."))}>Save customer</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <h3>Add Products</h3>
          <button type="button" className="link-button" onClick={() => setShowProductForm((current) => !current)}>+ Add product and price</button>
          {showProductForm && (
            <div className="inline-create-form">
              <input placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
              <input placeholder="Category" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} />
              <input type="number" min="0" placeholder="Selling price" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} />
              <input type="number" min="0" placeholder="Cost price" value={productForm.costPrice} onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })} />
              <select value={productForm.billingType} onChange={(event) => setProductForm({ ...productForm, billingType: event.target.value })}><option value="ONE_TIME">One-time</option><option value="RECURRING">Recurring</option></select>
              <button type="button" className="primary-button" onClick={() => addProduct().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to add product."))}>Save product</button>
            </div>
          )}

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
