import { MessageSquare, UserRound, Users } from "lucide-react";

function CustomerPortal() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER EXPERIENCE</span>
          <h1>Customer Portal</h1>
          <p>Manage customer negotiations, conversations, and deal updates.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <Users size={20} />
          </div>
          <span>Active Customers</span>
          <strong>86</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <MessageSquare size={20} />
          </div>
          <span>Open Negotiations</span>
          <strong>7</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <UserRound size={20} />
          </div>
          <span>Customer Requests</span>
          <strong>14</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Customer Negotiations</h2>
            <p>Customer conversations and negotiation activity will appear here.</p>
          </div>
        </div>

        <div className="empty-state">
          <MessageSquare size={42} />
          <h3>Customer portal ready</h3>
          <p>
            Customer negotiation and re-approval activity will appear here once
            connected to the backend.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerPortal;