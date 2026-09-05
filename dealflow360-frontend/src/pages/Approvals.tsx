import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const approvals = [
  {
    id: "APR-1042",
    deal: "DL-2401",
    customer: "Tata Technologies",
    requested: "18%",
    allowed: "15%",
    impact: "₹1.24L",
    risk: "High",
    submitted: "18 min ago",
    priority: "urgent",
  },
  {
    id: "APR-1039",
    deal: "DL-2394",
    customer: "Mahindra & Mahindra",
    requested: "12%",
    allowed: "10%",
    impact: "₹63K",
    risk: "Medium",
    submitted: "2 hrs ago",
    priority: "normal",
  },
  {
    id: "APR-1036",
    deal: "DL-2382",
    customer: "Larsen & Toubro",
    requested: "16%",
    allowed: "12%",
    impact: "₹91K",
    risk: "High",
    submitted: "Yesterday",
    priority: "urgent",
  },
];

const riskClass: Record<string, string> = {
  High: "approval-risk-high",
  Medium: "approval-risk-medium",
};

function Approvals() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">DEAL GOVERNANCE</p>
          <h1>Discount Approvals</h1>
          <p className="page-description">
            Review and act on commercial decisions routed by the Deal Engine.
          </p>
        </div>

        <div className="approval-engine-status">
          <span></span>
          Deal Engine Active
        </div>
      </div>

      <div className="approval-kpis">
        <div className="approval-kpi-card">
          <div className="approval-kpi-icon orange">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Pending Approval</span>
            <strong>8</strong>
            <small>3 are urgent</small>
          </div>
        </div>

        <div className="approval-kpi-card">
          <div className="approval-kpi-icon red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>High Risk</span>
            <strong>3</strong>
            <small>Require manager review</small>
          </div>
        </div>

        <div className="approval-kpi-card">
          <div className="approval-kpi-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Approved Today</span>
            <strong>14</strong>
            <small>₹82.6L deal value</small>
          </div>
        </div>

        <div className="approval-kpi-card">
          <div className="approval-kpi-icon blue">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span>Governance Rate</span>
            <strong>96.8%</strong>
            <small>Policy-compliant deals</small>
          </div>
        </div>
      </div>

      <div className="approval-workspace">
        <section className="approval-table-card">
          <div className="approval-table-header">
            <div>
              <h2>Pending Decisions</h2>
              <span>Deals currently awaiting approval</span>
            </div>

            <button className="approval-filter-button">
              All Requests
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="approval-table-wrapper">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>REQUEST</th>
                  <th>DEAL / CUSTOMER</th>
                  <th>DISCOUNT</th>
                  <th>IMPACT</th>
                  <th>RISK</th>
                  <th>SUBMITTED</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td>
                      <div className="approval-request">
                        <span
                          className={
                            approval.priority === "urgent"
                              ? "priority-dot urgent"
                              : "priority-dot"
                          }
                        ></span>
                        <div>
                          <strong>{approval.id}</strong>
                          <span>{approval.deal}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="approval-customer">
                        <strong>{approval.customer}</strong>
                        <span>Enterprise quotation</span>
                      </div>
                    </td>

                    <td>
                      <div className="discount-comparison">
                        <strong>{approval.requested}</strong>
                        <ArrowRight size={13} />
                        <span>{approval.allowed} allowed</span>
                      </div>
                    </td>

                    <td>
                      <strong className="approval-impact">
                        {approval.impact}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`approval-risk ${
                          riskClass[approval.risk]
                        }`}
                      >
                        {approval.risk}
                      </span>
                    </td>

                    <td className="approval-time">
                      {approval.submitted}
                    </td>

                    <td>
                      <button className="approval-more-button">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="approval-detail-card">
          <div className="detail-label">SELECTED REQUEST</div>

          <div className="detail-title-row">
            <div>
              <h2>APR-1042</h2>
              <span>DL-2401 · Tata Technologies</span>
            </div>

            <span className="detail-risk">HIGH RISK</span>
          </div>

          <div className="approval-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Approval required</strong>
              <p>
                The submitted commercial terms require an approval decision
                from the assigned authority.
              </p>
            </div>
          </div>

          <div className="decision-grid">
            <div>
              <span>Requested</span>
              <strong>18%</strong>
            </div>

            <div>
              <span>Allowed</span>
              <strong>15%</strong>
            </div>

            <div>
              <span>Risk Score</span>
              <strong>72 / 100</strong>
            </div>

            <div>
              <span>Margin</span>
              <strong>24.6%</strong>
            </div>
          </div>

          <div className="detail-section">
            <span className="detail-section-title">DEAL INTELLIGENCE</span>

            <div className="intelligence-row">
              <span>Discount variance</span>
              <strong>+3%</strong>
            </div>

            <div className="intelligence-row">
              <span>Potential margin impact</span>
              <strong>₹1.24L</strong>
            </div>

            <div className="intelligence-row">
              <span>Approval level</span>
              <strong>Manager</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button className="reject-button">
              <XCircle size={17} />
              Reject
            </button>

            <button className="approve-button">
              <CheckCircle2 size={17} />
              Approve
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Approvals;