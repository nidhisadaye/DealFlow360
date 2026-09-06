import { MessageSquare, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";

type PortalData = {
  customer: { name: string; company: string; email: string; tier: string };
  deals: Array<{ id: string; title: string; status: string; total_amount: number; discount_percent: number }>;
  negotiations: Array<{ id: string; deal_id: string; description: string; proposed_discount_percent: number | null; status: string }>;
  counts: { deals: number; openNegotiations: number };
};

type InternalCustomer = { id: string; name: string; company: string; email: string; tier: string; is_active?: boolean };

function CustomerPortal() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [internalCustomers, setInternalCustomers] = useState<InternalCustomer[]>([]);
  const user = JSON.parse(localStorage.getItem("dealflow360_user") || "null");

  useEffect(() => {
    const token = localStorage.getItem("dealflow360_token");
    const endpoint = user?.role === "CUSTOMER" ? "http://localhost:5000/api/customer-portal/overview" : "http://localhost:5000/api/customers";
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load portal data.");
        if (user?.role === "CUSTOMER") setData(result.data);
        else setInternalCustomers(result.data || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load portal data."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== "CUSTOMER") {
    return (
      <div className="page-container">
        <div className="page-header"><div><span className="eyebrow">CUSTOMER MANAGEMENT</span><h1>Customers</h1><p>Customer records connected to your sales workspace.</p></div></div>
        <div className="content-card">
          <div className="card-header"><div><h2>Customer Directory</h2><p>{loading ? "Loading customers..." : `${internalCustomers.length} customers from the database`}</p></div></div>
          {error ? <div className="empty-state"><h3>Unable to load customers</h3><p>{error}</p></div> : internalCustomers.length === 0 && !loading ? <div className="empty-state"><h3>No customers found</h3><p>Add customer records to MySQL to display them here.</p></div> : <div className="portal-deal-list">{internalCustomers.map((customer) => <div className="portal-deal-row" key={customer.id}><div><strong>{customer.name}</strong><p>{customer.company} · {customer.email}</p></div><strong>{customer.tier}</strong></div>)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER EXPERIENCE</span>
          <h1>Customer Portal</h1>
          <p>{data?.customer.company || "Manage your quotations, negotiations, and deal updates."}</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <Users size={20} />
          </div>
          <span>Active Customers</span>
          <strong>{data ? 1 : 0}</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <MessageSquare size={20} />
          </div>
          <span>Open Negotiations</span>
          <strong>{data?.counts.openNegotiations || 0}</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <UserRound size={20} />
          </div>
          <span>Customer Requests</span>
          <strong>{data?.counts.deals || 0}</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Customer Negotiations</h2>
            <p>{data?.customer.email || "Customer conversations and negotiation activity."}</p>
          </div>
        </div>

        {loading ? <div className="empty-state"><p>Loading customer data...</p></div> : error ? <div className="empty-state"><MessageSquare size={42} /><h3>Unable to load portal</h3><p>{error}</p></div> : data?.deals.length ? (
          <div className="portal-deal-list">
            {data.deals.map((deal) => <div className="portal-deal-row" key={deal.id}><div><strong>{deal.title}</strong><p>{deal.id} · {deal.status.replaceAll("_", " ")}</p></div><strong>₹{Number(deal.total_amount || 0).toLocaleString("en-IN")}</strong></div>)}
          </div>
        ) : <div className="empty-state"><MessageSquare size={42} /><h3>No quotations yet</h3><p>Your quotations and negotiation activity will appear here.</p></div>}
      </div>
    </div>
  );
}

export default CustomerPortal;