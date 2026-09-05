import { CreditCard, FileText, Repeat } from "lucide-react";

function Billing() {
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
          <strong>18</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Repeat size={20} />
          </div>
          <span>Active Subscriptions</span>
          <strong>34</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <CreditCard size={20} />
          </div>
          <span>Ready to Bill</span>
          <strong>₹18.6L</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Billing Workspace</h2>
            <p>One-time and recurring billing operations will appear here.</p>
          </div>
        </div>

        <div className="empty-state">
          <CreditCard size={42} />
          <h3>Billing workspace ready</h3>
          <p>
            Invoice generation, subscription management, and payment decisions
            will appear here once connected to the backend.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Billing;