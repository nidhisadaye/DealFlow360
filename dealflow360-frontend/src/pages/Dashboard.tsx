import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, Clock3, IndianRupee, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type DashboardData = {
  metrics: { activeDeals: number; pipelineValue: number; pendingApprovals: number; atRiskDeals: number };
  health: { on_track: number; at_risk: number; stalled: number };
  alerts: Array<{ id: string; deal_id: string; reason: string | null; risk_score: number; created_at: string; deal_title: string; customer_name: string }>;
  recentDeals: Array<{ id: string; title: string; status: string; total_amount: number; risk_level: string; updated_at: string; customer_name: string; owner_name: string }>;
};

const emptyData: DashboardData = {
  metrics: { activeDeals: 0, pipelineValue: 0, pendingApprovals: 0, atRiskDeals: 0 },
  health: { on_track: 0, at_risk: 0, stalled: 0 },
  alerts: [],
  recentDeals: [],
};

function Dashboard({ onNavigate }: { onNavigate: (page: "Deals" | "Deal Builder" | "Approvals") => void }) {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const storedUser = localStorage.getItem("dealflow360_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const totalHealth = data.health.on_track + data.health.at_risk + data.health.stalled;
  const healthScore = totalHealth ? Math.round((data.health.on_track / totalHealth) * 100) : 0;
  const percent = (value: number) => totalHealth ? `${Math.round((value / totalHealth) * 100)}%` : "0%";
  const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const relativeTime = (value: string) => {
    const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
    return hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    const token = localStorage.getItem("dealflow360_token");
    if (!token) { setLoading(false); return; }
    fetch("http://localhost:5000/api/dashboard/summary", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load dashboard.");
        setData(result.data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard"><p>Loading dashboard...</p></div>;
  if (error) return <div className="dashboard"><p>{error}</p></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div><p className="section-label">Overview</p><h2>Good morning, {user?.name || "there"}!</h2><p className="section-subtitle">Here is what is happening across your deals today.</p></div>
        <button className="primary-button" onClick={() => onNavigate("Deal Builder")}>+ Create Deal</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-top"><div className="stat-icon blue"><BriefcaseBusiness size={20} /></div><span className="stat-trend positive"><TrendingUp size={13} />Live</span></div><span className="stat-label">Active Deals</span><strong>{data.metrics.activeDeals}</strong><small>From database</small></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-icon green"><IndianRupee size={20} /></div><span className="stat-trend positive"><TrendingUp size={13} />Live</span></div><span className="stat-label">Pipeline Value</span><strong>{money(data.metrics.pipelineValue)}</strong><small>Open deal value</small></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-icon orange"><Clock3 size={20} /></div><span className="stat-trend attention">Needs review</span></div><span className="stat-label">Pending Approvals</span><strong>{data.metrics.pendingApprovals}</strong><small>Database requests</small></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-icon red"><ShieldAlert size={20} /></div><span className="stat-trend danger">Risk data</span></div><span className="stat-label">At-Risk Deals</span><strong>{data.metrics.atRiskDeals}</strong><small>High or critical risk</small></div>
      </div>

      <div className="dashboard-grid">
        <div className="panel"><div className="panel-header"><div><h3>Deal Health</h3><p>Live overview of your pipeline</p></div><button className="secondary-button" onClick={() => onNavigate("Deals")}>View Details <ArrowUpRight size={14} /></button></div>
          <div className="health-container"><div className="health-circle"><div className="health-score">{healthScore}</div><span>Health Score</span><small>Based on risk status</small></div><div className="health-info"><div className="health-message"><div className="health-message-icon"><TrendingUp size={19} /></div><div><strong>{healthScore >= 70 ? "Healthy Pipeline" : "Pipeline Needs Attention"}</strong><p>Calculated from live deal risk levels.</p></div></div><div className="health-stats"><div><span><i className="status-dot green-dot" />On Track</span><strong>{data.health.on_track}</strong><small>{percent(data.health.on_track)}</small></div><div><span><i className="status-dot orange-dot" />At Risk</span><strong>{data.health.at_risk}</strong><small>{percent(data.health.at_risk)}</small></div><div><span><i className="status-dot red-dot" />Stalled</span><strong>{data.health.stalled}</strong><small>{percent(data.health.stalled)}</small></div></div></div></div>
          <div className="ai-insight"><Sparkles size={17} /><span><strong>Deal intelligence:</strong> {data.metrics.atRiskDeals} deal(s) currently need attention based on stored risk data.</span></div>
        </div>

        <div className="panel"><div className="panel-header"><div><h3>Needs Attention</h3><p>Live approval requests</p></div><button className="secondary-button" onClick={() => onNavigate("Approvals")}>View All <ArrowUpRight size={14} /></button></div><div className="attention-list">
          {data.alerts.length ? data.alerts.map((alert) => <div className="attention-item" key={alert.id}><div className="attention-icon danger-icon"><AlertTriangle size={18} /></div><div className="attention-content"><strong>{alert.deal_title}</strong><p>{alert.reason || `${alert.deal_id} requires a decision.`}</p></div><div className="attention-meta"><span className="priority high">Risk {Number(alert.risk_score || 0)}</span><small>{relativeTime(alert.created_at)}</small></div></div>) : <p>No pending approval alerts.</p>}
        </div><button className="view-alerts" onClick={() => onNavigate("Approvals")}>View all approvals <ArrowUpRight size={15} /></button></div>
      </div>

      <div className="panel recent-deals"><div className="panel-header"><div><h3>Recent Deals</h3><p>Latest database activity</p></div><button className="secondary-button" onClick={() => onNavigate("Deals")}>View All Deals <ArrowUpRight size={14} /></button></div><div className="deals-table"><div className="table-header"><span>Deal ID</span><span>Customer</span><span>Deal Value</span><span>Stage</span><span>Health</span><span>Last Activity</span><span>Owner</span></div>
        {data.recentDeals.length ? data.recentDeals.map((deal) => <div className="deal-row" key={deal.id}><strong>{deal.id}</strong><span>{deal.customer_name}</span><strong>{money(deal.total_amount)}</strong><span className="stage negotiation">{deal.status.replaceAll("_", " ")}</span><span className={`health-status ${["HIGH", "CRITICAL"].includes(deal.risk_level) ? "at-risk" : "on-track"}`}><i />{deal.risk_level || "LOW"}</span><span>{relativeTime(deal.updated_at)}</span><span className="owner"><i>{deal.owner_name?.charAt(0) || "-"}</i>{deal.owner_name}</span></div>) : <p>No deals found.</p>}
      </div></div>
    </div>
  );
}

export default Dashboard;
