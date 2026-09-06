import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MoreHorizontal, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Approval = { id: string; deal_id: string; requested_discount_percent: number; allowed_discount_percent: number; risk_score: number; reason: string; created_at: string; deal_title?: string; customer_name?: string; total_amount?: number; status: string };
const canDecide = ["SALES_MANAGER", "FINANCE_OPERATIONS", "ADMIN"];
const money = (value: number | undefined) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("dealflow360_user") || "{}");
  const mayDecide = canDecide.includes(user.role);
  const selected = approvals.find((approval) => approval.id === selectedId) || approvals[0];

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/approvals", { headers: { Authorization: `Bearer ${localStorage.getItem("dealflow360_token")}` } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Failed to load approvals.");
      const pending = (result.data || []).filter((approval: Approval) => approval.status === "PENDING");
      setApprovals(pending);
      setSelectedId((current) => pending.some((approval: Approval) => approval.id === current) ? current : (pending[0]?.id || ""));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load approvals.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadApprovals(); }, []);

  const decide = async (action: "approve" | "reject") => {
    if (!selected || !mayDecide) return;
    const response = await fetch(`http://localhost:5000/api/deals/${selected.deal_id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("dealflow360_token")}` },
      body: JSON.stringify(action === "approve" ? { comments: "Approved from DealFlow360" } : { reason: "Rejected from DealFlow360" }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) return alert(result.error?.message || `Unable to ${action} this deal.`);
    await loadApprovals();
  };

  const highRisk = approvals.filter((approval) => Number(approval.risk_score) >= 70).length;
  return <div className="page-container">
    <div className="page-header"><div><p className="page-eyebrow">DEAL GOVERNANCE</p><h1>Discount Approvals</h1><p className="page-description">Review live approval requests created by the Deal Engine.</p></div><div className="approval-engine-status"><span></span>Deal Engine Active</div></div>
    <div className="approval-kpis">
      <div className="approval-kpi-card"><div className="approval-kpi-icon orange"><Clock3 size={20} /></div><div><span>Pending Approval</span><strong>{approvals.length}</strong><small>Live requests</small></div></div>
      <div className="approval-kpi-card"><div className="approval-kpi-icon red"><AlertTriangle size={20} /></div><div><span>High Risk</span><strong>{highRisk}</strong><small>Risk score 70 or above</small></div></div>
      <div className="approval-kpi-card"><div className="approval-kpi-icon green"><CheckCircle2 size={20} /></div><div><span>Your Access</span><strong>{mayDecide ? "Approver" : "Read only"}</strong><small>{user.role?.replaceAll("_", " ") || "No role"}</small></div></div>
      <div className="approval-kpi-card"><div className="approval-kpi-icon blue"><ShieldCheck size={20} /></div><div><span>Governance</span><strong>Live</strong><small>Database-backed</small></div></div>
    </div>
    <div className="approval-workspace"><section className="approval-table-card"><div className="approval-table-header"><div><h2>Pending Decisions</h2><span>Deals currently awaiting approval</span></div><button className="approval-filter-button" onClick={loadApprovals}><ArrowRight size={15} />Refresh</button></div>
      <div className="approval-table-wrapper"><table className="approval-table"><thead><tr><th>REQUEST</th><th>DEAL</th><th>DISCOUNT</th><th>IMPACT</th><th>RISK</th><th>SUBMITTED</th><th></th></tr></thead><tbody>
        {loading ? <tr><td colSpan={7}>Loading approvals...</td></tr> : approvals.length === 0 ? <tr><td colSpan={7}>No pending approvals.</td></tr> : approvals.map((approval) => <tr key={approval.id} onClick={() => setSelectedId(approval.id)} style={{ cursor: "pointer" }}>
          <td><div className="approval-request"><span className={Number(approval.risk_score) >= 70 ? "priority-dot urgent" : "priority-dot"}></span><div><strong>{approval.id}</strong><span>{approval.deal_id}</span></div></div></td>
          <td><div className="approval-customer"><strong>{approval.deal_title || approval.deal_id}</strong><span>{approval.customer_name || "Customer"}</span></div></td>
          <td><div className="discount-comparison"><strong>{Number(approval.requested_discount_percent)}%</strong><ArrowRight size={13} /><span>{Number(approval.allowed_discount_percent)}% allowed</span></div></td>
          <td><strong className="approval-impact">{money(approval.total_amount)}</strong></td><td><span className={`approval-risk ${Number(approval.risk_score) >= 70 ? "approval-risk-high" : "approval-risk-medium"}`}>{Number(approval.risk_score)}</span></td><td className="approval-time">{new Date(approval.created_at).toLocaleString("en-IN")}</td><td><button className="approval-more-button" onClick={(event) => { event.stopPropagation(); setSelectedId(approval.id); }}><MoreHorizontal size={18} /></button></td>
        </tr>)}</tbody></table></div>
      </section><aside className="approval-detail-card">{selected ? <><div className="detail-label">SELECTED REQUEST</div><div className="detail-title-row"><div><h2>{selected.id}</h2><span>{selected.deal_id} · {selected.customer_name || "Customer"}</span></div><span className="detail-risk">RISK {Number(selected.risk_score)}</span></div><div className="approval-alert"><AlertTriangle size={18} /><div><strong>Approval required</strong><p>{selected.reason || "The Deal Engine requested a decision."}</p></div></div><div className="decision-grid"><div><span>Requested</span><strong>{Number(selected.requested_discount_percent)}%</strong></div><div><span>Allowed</span><strong>{Number(selected.allowed_discount_percent)}%</strong></div><div><span>Risk Score</span><strong>{Number(selected.risk_score)} / 100</strong></div><div><span>Value</span><strong>{money(selected.total_amount)}</strong></div></div><div className="detail-actions"><button className="reject-button" disabled={!mayDecide} title={mayDecide ? "Reject selected deal" : "A manager, finance operator, or admin must decide"} onClick={() => decide("reject")}><XCircle size={17} />Reject</button><button className="approve-button" disabled={!mayDecide} title={mayDecide ? "Approve selected deal" : "A manager, finance operator, or admin must decide"} onClick={() => decide("approve")}><CheckCircle2 size={17} />Approve</button></div></> : <div className="empty-state"><ShieldCheck size={42} /><h3>No request selected</h3><p>Create and evaluate a deal requiring approval to test this page.</p></div>}</aside></div>
  </div>;
}

export default Approvals;
