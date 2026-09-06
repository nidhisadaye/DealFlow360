import {
  ArrowUpRight,
  CalendarDays,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";

type Deal = {
  id: string;
  customer_id: string;
  title: string;
  status: string;
  total_amount: number;
  risk_level: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_company: string;
  owner_name: string;
};

type Summary = {
  total: number;
  open_pipeline: number;
  approved_value: number;
  needs_attention: number;
  created_this_month: number;
  created_this_month_value: number;
};

const statusClass: Record<string, string> = {
  DRAFT: "status-info",
  UNDER_REVIEW: "status-info",
  APPROVAL_REQUIRED: "status-warning",
  APPROVED: "status-success",
  REJECTED: "status-danger",
  NEGOTIATION: "status-warning",
  REAPPROVAL_REQUIRED: "status-warning",
  FULFILLMENT_PENDING: "status-purple",
  READY_TO_BILL: "status-success",
  CLOSED: "status-success",
};

const riskClass: Record<string, string> = {
  LOW: "risk-low",
  MEDIUM: "risk-medium",
  HIGH: "risk-high",
  CRITICAL: "risk-high",
};

function Deals({ onCreateDeal }: { onCreateDeal: () => void }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<Summary>({ total: 0, open_pipeline: 0, approved_value: 0, needs_attention: 0, created_this_month: 0, created_this_month_value: 0 });

  const limit = 20;

  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("dealflow360_token");

        if (!token) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const headers = { Authorization: `Bearer ${token}` };
        const [response, summaryResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/deals?${params}`, { headers }),
          fetch(`http://localhost:5000/api/deals/summary?${params}`, { headers }),
        ]);
        const result = await response.json();
        const summaryResult = await summaryResponse.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result?.error?.message || "Failed to load deals."
          );
        }

        setDeals(result.data || []);
        setTotal(result.meta?.total || 0);
        setTotalPages(result.meta?.totalPages || 1);
        if (summaryResponse.ok && summaryResult.success) setSummary(summaryResult.data);
      } catch (error) {
        console.error("Failed to load deals:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to load deals."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, [page, search, status]);

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatRisk = (risk: string) => {
    return risk
      ? risk.charAt(0) + risk.slice(1).toLowerCase()
      : "Low";
  };

  const applySearch = () => { setPage(1); setSearch(searchInput.trim()); };
  const clearFilters = () => { setPage(1); setStatus(""); setSearch(""); setSearchInput(""); };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">SALES OPERATIONS</p>
          <h1>Deals & Quotations</h1>
          <p className="page-description">
            Manage your sales pipeline and monitor deal intelligence from one
            place.
          </p>
        </div>

        <button className="primary-button" onClick={onCreateDeal}>
          <Plus size={18} />
          Create Deal
        </button>
      </div>

      <div className="deals-summary">
        <div className="deal-summary-card">
          <div className="deal-summary-icon blue">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <span>Open Pipeline</span>
            <strong>{formatCurrency(summary.open_pipeline)}</strong>
            <small>{summary.total} deals in pipeline</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon orange">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Closing This Month</span>
            <strong>{summary.created_this_month} Deals</strong>
            <small>{formatCurrency(summary.created_this_month_value)} created this month</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon green">
            <span>✓</span>
          </div>
          <div>
            <span>Approved Value</span>
            <strong>{formatCurrency(summary.approved_value)}</strong>
            <small>{summary.open_pipeline > 0 ? Math.round((summary.approved_value / summary.open_pipeline) * 100) : 0}% of open pipeline</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon red">
            <span>!</span>
          </div>
          <div>
            <span>Needs Attention</span>
            <strong>{summary.needs_attention} Deals</strong>
            <small>Require approval or reapproval</small>
          </div>
        </div>
      </div>

      <div className="deals-toolbar">
        <div className="deals-search">
          <Search size={18} />
          <input
            placeholder="Search deals or customers..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applySearch()}
          />
        </div>

        <div className="deal-filters">
          <button className="filter-button" onClick={applySearch}>
            <Filter size={17} />
            Search
          </button>

          <select className="filter-button" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            {Object.keys(statusClass).map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}
          </select>

          <button className="filter-button" onClick={clearFilters}>
            <SlidersHorizontal size={17} />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="deals-table-card">
        <div className="table-header">
          <div>
            <h2>All Deals</h2>
            <span>{total} active deals</span>
          </div>

          <button className="view-button" onClick={clearFilters}>View Pipeline</button>
        </div>

        <div className="deals-table-wrapper">
          <table className="deals-table">
            <thead>
              <tr>
                <th>DEAL</th>
                <th>CUSTOMER</th>
                <th>OWNER</th>
                <th>VALUE</th>
                <th>STATUS</th>
                <th>RISK</th>
                <th>UPDATED</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px" }}>
                    Loading deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px" }}>
                    No deals found.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <div className="deal-id">{deal.id}</div>
                      <div className="deal-product">{deal.title}</div>
                    </td>

                    <td>
                      <div className="customer-name">{deal.customer_name || deal.customer_company || deal.customer_id}</div>
                    </td>

                    <td>
                      <div className="owner-cell">
                        <div className="owner-avatar">{(deal.owner_name || "?").charAt(0)}</div>
                        {deal.owner_name || "Unassigned"}
                      </div>
                    </td>

                    <td>
                      <strong className="deal-value">
                        {formatCurrency(deal.total_amount)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          statusClass[deal.status] || "status-info"
                        }`}
                      >
                        {formatStatus(deal.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`risk-pill ${
                          riskClass[deal.risk_level] || "risk-low"
                        }`}
                      >
                        <span className="risk-dot"></span>
                        {formatRisk(deal.risk_level)}
                      </span>
                    </td>

                    <td className="updated-cell">
                      {new Date(deal.updated_at || deal.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td>
                      <button className="icon-button" title={`Deal ${deal.id}: ${formatStatus(deal.status)}`} onClick={() => alert(`${deal.id}\n${deal.title}\nStatus: ${formatStatus(deal.status)}\nValue: ${formatCurrency(deal.total_amount)}`)}>
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {deals.length} of {total} deals
          </span>

          <div className="pagination">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
            .map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={pageNumber === page ? "active-page" : ""}
                  onClick={() => setPage(pageNumber)}
                  disabled={loading}
                >
                  {pageNumber}
                </button>
              ))}

            <button
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Deals;
