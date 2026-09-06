import { CreditCard, FileText, Repeat, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  deal_id: string;
  customer_id: string;
  invoice_type: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  created_at: string;
};

type Subscription = {
  id: string;
  deal_id: string;
  product_id: string;
  billing_interval: string;
  amount: number;
  start_date: string;
  next_billing_date: string | null;
  status: string;
  created_at: string;
};

function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ dealId: "", amount: "", invoiceType: "ONE_TIME", dueDate: "" });
  const [subscriptionForm, setSubscriptionForm] = useState({ dealId: "", productId: "", billingInterval: "MONTHLY", amount: "" });
  const user = JSON.parse(localStorage.getItem("dealflow360_user") || "{}");
  const mayCreateBilling = ["SALES_MANAGER", "FINANCE_OPERATIONS", "ADMIN"].includes(user.role);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("dealflow360_token");
      if (!token) throw new Error("Session expired. Please log in again.");

      const [invoicesRes, subscriptionsRes] = await Promise.all([
        fetch("http://localhost:5000/api/invoices", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/subscriptions", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const invoicesData = await invoicesRes.json();
      const subscriptionsData = await subscriptionsRes.json();

      if (invoicesData.success) setInvoices(invoicesData.data || []);
      if (subscriptionsData.success) setSubscriptions(subscriptionsData.data || []);
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.dealId || !invoiceForm.amount) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const token = localStorage.getItem("dealflow360_token");
      const response = await fetch(`http://localhost:5000/api/deals/${invoiceForm.dealId}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceType: invoiceForm.invoiceType,
          amount: Number(invoiceForm.amount),
          dueDate: invoiceForm.dueDate || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Invoice created successfully!");
        setShowInvoiceForm(false);
        setInvoiceForm({ dealId: "", amount: "", invoiceType: "ONE_TIME", dueDate: "" });
        loadBillingData();
      } else {
        alert("Failed to create invoice: " + (result.error?.message || "Unknown error"));
      }
    } catch (error) {
      alert("Error creating invoice: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCreateSubscription = async () => {
    if (!subscriptionForm.dealId || !subscriptionForm.productId || !subscriptionForm.amount) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const token = localStorage.getItem("dealflow360_token");
      const response = await fetch(`http://localhost:5000/api/deals/${subscriptionForm.dealId}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: subscriptionForm.productId,
          billingInterval: subscriptionForm.billingInterval,
          amount: Number(subscriptionForm.amount),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Subscription created successfully!");
        setShowSubscriptionForm(false);
        setSubscriptionForm({ dealId: "", productId: "", billingInterval: "MONTHLY", amount: "" });
        loadBillingData();
      } else {
        alert("Failed to create subscription: " + (result.error?.message || "Unknown error"));
      }
    } catch (error) {
      alert("Error creating subscription: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const pendingInvoices = invoices.filter((inv) => ["DRAFT", "ISSUED", "OVERDUE"].includes(inv.status)).length;
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "ACTIVE").length;
  const readyToBillAmount = invoices
    .filter((inv) => inv.status === "ISSUED")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">REVENUE OPERATIONS</span>
          <h1>Billing & Subscriptions</h1>
          <p>Manage invoices, recurring billing, and payment status.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <FileText size={20} />
          </div>
          <span>Pending Invoices</span>
          <strong>{pendingInvoices}</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Repeat size={20} />
          </div>
          <span>Active Subscriptions</span>
          <strong>{activeSubscriptions}</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <CreditCard size={20} />
          </div>
          <span>Ready to Bill</span>
          <strong>₹{readyToBillAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Invoices</h2>
            <p>{invoices.length} invoices in total</p>
          </div>
          <button className="primary-button" disabled={!mayCreateBilling} title={mayCreateBilling ? "Create invoice" : "A manager, finance operator, or admin can create invoices"} onClick={() => setShowInvoiceForm(!showInvoiceForm)}>
            <Plus size={18} />
            Create Invoice
          </button>
        </div>

        {showInvoiceForm && (
          <div className="form-section" style={{ padding: "20px", borderBottom: "1px solid #e0e0e0" }}>
            <input
              type="text"
              placeholder="Deal ID"
              value={invoiceForm.dealId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dealId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={invoiceForm.amount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <select
              value={invoiceForm.invoiceType}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            >
              <option value="ONE_TIME">One-Time</option>
              <option value="RECURRING">Recurring</option>
            </select>
            <input
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <button onClick={handleCreateInvoice} style={{ marginRight: "10px" }}>Create</button>
            <button onClick={() => setShowInvoiceForm(false)}>Cancel</button>
          </div>
        )}

        <div className="table-section" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>No invoices yet</p>
          ) : (
            <table style={{ width: "100%", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>Invoice ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Deal ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px" }}>{inv.id}</td>
                    <td style={{ padding: "10px" }}>{inv.deal_id}</td>
                    <td style={{ padding: "10px" }}>₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px" }}>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "20px" }}>
        <div className="card-header">
          <div>
            <h2>Subscriptions</h2>
            <p>{subscriptions.length} subscriptions in total</p>
          </div>
          <button className="primary-button" disabled={!mayCreateBilling} title={mayCreateBilling ? "Create subscription" : "A manager, finance operator, or admin can create subscriptions"} onClick={() => setShowSubscriptionForm(!showSubscriptionForm)}>
            <Plus size={18} />
            Create Subscription
          </button>
        </div>

        {showSubscriptionForm && (
          <div className="form-section" style={{ padding: "20px", borderBottom: "1px solid #e0e0e0" }}>
            <input
              type="text"
              placeholder="Deal ID"
              value={subscriptionForm.dealId}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, dealId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <input
              type="text"
              placeholder="Product ID"
              value={subscriptionForm.productId}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, productId: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <select
              value={subscriptionForm.billingInterval}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, billingInterval: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={subscriptionForm.amount}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
              style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <button onClick={handleCreateSubscription} style={{ marginRight: "10px" }}>Create</button>
            <button onClick={() => setShowSubscriptionForm(false)}>Cancel</button>
          </div>
        )}

        <div className="table-section" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading subscriptions...</p>
          ) : subscriptions.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>No subscriptions yet</p>
          ) : (
            <table style={{ width: "100%", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>Subscription ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Deal ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Interval</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px" }}>{sub.id}</td>
                    <td style={{ padding: "10px" }}>{sub.deal_id}</td>
                    <td style={{ padding: "10px" }}>₹{sub.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px" }}>{sub.billing_interval}</td>
                    <td style={{ padding: "10px" }}>{sub.status}</td>
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

export default Billing;
