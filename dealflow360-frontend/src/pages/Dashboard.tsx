import {
  BriefcaseBusiness,
  IndianRupee,
  Clock3,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  Truck,
} from "lucide-react";

function Dashboard({ onNavigate }: { onNavigate: (page: "Deals" | "Deal Builder" | "Approvals") => void }) {
  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <p className="section-label">Overview</p>

          <h2>Good morning, Nidhi! 👋</h2>

          <p className="section-subtitle">
            Here's what's happening across your deals today.
          </p>
        </div>

        <button className="primary-button" onClick={() => onNavigate("Deal Builder")}>
          + Create Deal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <BriefcaseBusiness size={20} />
            </div>

            <span className="stat-trend positive">
              <TrendingUp size={13} />
              12.5%
            </span>
          </div>

          <span className="stat-label">Active Deals</span>

          <strong>24</strong>

          <small>vs last month</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <IndianRupee size={20} />
            </div>

            <span className="stat-trend positive">
              <TrendingUp size={13} />
              8.2%
            </span>
          </div>

          <span className="stat-label">Pipeline Value</span>

          <strong>₹48.6L</strong>

          <small>vs last month</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon orange">
              <Clock3 size={20} />
            </div>

            <span className="stat-trend attention">
              3 high priority
            </span>
          </div>

          <span className="stat-label">Pending Approvals</span>

          <strong>7</strong>

          <small>Requires review</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon red">
              <ShieldAlert size={20} />
            </div>

            <span className="stat-trend danger">
              Needs attention
            </span>
          </div>

          <span className="stat-label">At-Risk Deals</span>

          <strong>4</strong>

          <small>Potential impact detected</small>
        </div>
      </div>

      {/* Main Dashboard Panels */}
      <div className="dashboard-grid">
        {/* Deal Health */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Deal Health</h3>

              <p>
                Real-time overview of your pipeline
              </p>
            </div>

            <button className="secondary-button" onClick={() => onNavigate("Deals")}>
              View Details
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="health-container">
            <div className="health-circle">
              <div className="health-score">
                82
              </div>

              <span>Health Score</span>

              <small>
                ↑ 6 pts vs last week
              </small>
            </div>

            <div className="health-info">
              <div className="health-message">
                <div className="health-message-icon">
                  <TrendingUp size={19} />
                </div>

                <div>
                  <strong>
                    Healthy Pipeline
                  </strong>

                  <p>
                    Most active deals are progressing
                    normally. Keep it up!
                  </p>
                </div>
              </div>

              <div className="health-stats">
                <div>
                  <span>
                    <i className="status-dot green-dot" />
                    On Track
                  </span>

                  <strong>16</strong>

                  <small>66.7%</small>
                </div>

                <div>
                  <span>
                    <i className="status-dot orange-dot" />
                    At Risk
                  </span>

                  <strong>4</strong>

                  <small>16.7%</small>
                </div>

                <div>
                  <span>
                    <i className="status-dot red-dot" />
                    Stalled
                  </span>

                  <strong>4</strong>

                  <small>16.7%</small>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-insight">
            <Sparkles size={17} />

            <span>
              <strong>AI Insight:</strong>{" "}
              2 deals are likely to close this month
              based on current activity.
            </span>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Needs Attention</h3>

              <p>
                Issues requiring action
              </p>
            </div>

            <button className="secondary-button" onClick={() => onNavigate("Approvals")}>
              View All
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="attention-list">
            <div className="attention-item">
              <div className="attention-icon danger-icon">
                <AlertTriangle size={18} />
              </div>

              <div className="attention-content">
                <strong>
                  Discount approval
                </strong>

                <p>
                  DEAL-001 requires manager approval.
                </p>
              </div>

              <div className="attention-meta">
                <span className="priority high">
                  High
                </span>

                <small>2h ago</small>
              </div>
            </div>

            <div className="attention-item">
              <div className="attention-icon warning-icon">
                <Truck size={18} />
              </div>

              <div className="attention-content">
                <strong>
                  Delivery slippage
                </strong>

                <p>
                  DEAL-007 may miss its promise date.
                </p>
              </div>

              <div className="attention-meta">
                <span className="priority medium">
                  Medium
                </span>

                <small>5h ago</small>
              </div>
            </div>

            <div className="attention-item">
              <div className="attention-icon warning-icon">
                <Clock3 size={18} />
              </div>

              <div className="attention-content">
                <strong>
                  Stalled deal
                </strong>

                <p>
                  DEAL-012 has had no activity recently.
                </p>
              </div>

              <div className="attention-meta">
                <span className="priority medium">
                  Medium
                </span>

                <small>1d ago</small>
              </div>
            </div>
          </div>

          <button className="view-alerts" onClick={() => onNavigate("Approvals")}>
            View all alerts
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="panel recent-deals">
        <div className="panel-header">
          <div>
            <h3>Recent Deals</h3>

            <p>
              Latest activity across your pipeline
            </p>
          </div>

          <button className="secondary-button" onClick={() => onNavigate("Deals")}>
            View All Deals
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="deals-table">
          <div className="table-header">
            <span>Deal ID</span>
            <span>Customer</span>
            <span>Deal Value</span>
            <span>Stage</span>
            <span>Health</span>
            <span>Last Activity</span>
            <span>Owner</span>
          </div>

          <div className="deal-row">
            <strong>DEAL-001</strong>
            <span>Acme Corporation</span>
            <strong>₹12.4L</strong>

            <span className="stage negotiation">
              Negotiation
            </span>

            <span className="health-status at-risk">
              <i />
              At Risk
            </span>

            <span>2h ago</span>

            <span className="owner">
              <i>N</i>
              Nidhi
            </span>
          </div>

          <div className="deal-row">
            <strong>DEAL-002</strong>
            <span>Global Tech Ltd.</span>
            <strong>₹8.7L</strong>

            <span className="stage proposal">
              Proposal
            </span>

            <span className="health-status on-track">
              <i />
              On Track
            </span>

            <span>5h ago</span>

            <span className="owner">
              <i>R</i>
              Rohan
            </span>
          </div>

          <div className="deal-row">
            <strong>DEAL-003</strong>
            <span>Sunrise Industries</span>
            <strong>₹5.6L</strong>

            <span className="stage qualification">
              Qualification
            </span>

            <span className="health-status on-track">
              <i />
              On Track
            </span>

            <span>1d ago</span>

            <span className="owner">
              <i>A</i>
              Aisha
            </span>
          </div>

          <div className="deal-row">
            <strong>DEAL-004</strong>
            <span>Vertex Solutions</span>
            <strong>₹9.2L</strong>

            <span className="stage negotiation">
              Negotiation
            </span>

            <span className="health-status at-risk">
              <i />
              At Risk
            </span>

            <span>1d ago</span>

            <span className="owner">
              <i>N</i>
              Nidhi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
