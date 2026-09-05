import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const deals = [
  {
    id: "DL-2401",
    customer: "Tata Technologies",
    product: "Enterprise Laptop + Device Management",
    owner: "Nidhi",
    value: "₹42.8L",
    status: "Approval Required",
    risk: "High",
    updated: "Today, 10:24 AM",
  },
  {
    id: "DL-2398",
    customer: "Reliance Industries",
    product: "Cloud Infrastructure Suite",
    owner: "Arjun",
    value: "₹68.4L",
    status: "Approved",
    risk: "Low",
    updated: "Today, 09:42 AM",
  },
  {
    id: "DL-2394",
    customer: "Mahindra & Mahindra",
    product: "Workforce Security Platform",
    owner: "Priya",
    value: "₹31.6L",
    status: "Under Review",
    risk: "Medium",
    updated: "Yesterday",
  },
  {
    id: "DL-2389",
    customer: "Infosys",
    product: "Device Management + Support",
    owner: "Rahul",
    value: "₹24.9L",
    status: "Fulfillment Pending",
    risk: "Low",
    updated: "Yesterday",
  },
  {
    id: "DL-2382",
    customer: "Larsen & Toubro",
    product: "Enterprise Hardware Bundle",
    owner: "Nidhi",
    value: "₹57.2L",
    status: "At Risk",
    risk: "High",
    updated: "2 days ago",
  },
];

const statusClass: Record<string, string> = {
  "Approval Required": "status-warning",
  Approved: "status-success",
  "Under Review": "status-info",
  "Fulfillment Pending": "status-purple",
  "At Risk": "status-danger",
};

const riskClass: Record<string, string> = {
  Low: "risk-low",
  Medium: "risk-medium",
  High: "risk-high",
};

function Deals() {
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

        <button className="primary-button">
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
            <strong>₹2.84 Cr</strong>
            <small>+12.6% this month</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon orange">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Closing This Month</span>
            <strong>18 Deals</strong>
            <small>₹96.4L potential value</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon green">
            <span>✓</span>
          </div>
          <div>
            <span>Approved Value</span>
            <strong>₹1.42 Cr</strong>
            <small>68% of active pipeline</small>
          </div>
        </div>

        <div className="deal-summary-card">
          <div className="deal-summary-icon red">
            <span>!</span>
          </div>
          <div>
            <span>Needs Attention</span>
            <strong>6 Deals</strong>
            <small>3 require immediate action</small>
          </div>
        </div>
      </div>

      <div className="deals-toolbar">
        <div className="deals-search">
          <Search size={18} />
          <input placeholder="Search deals, customers or products..." />
        </div>

        <div className="deal-filters">
          <button className="filter-button">
            <Filter size={17} />
            Status
            <ChevronDown size={15} />
          </button>

          <button className="filter-button">
            <SlidersHorizontal size={17} />
            More Filters
          </button>

          <button className="filter-button">
            This Month
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      <div className="deals-table-card">
        <div className="table-header">
          <div>
            <h2>All Deals</h2>
            <span>42 active deals</span>
          </div>

          <button className="view-button">View Pipeline</button>
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
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <div className="deal-id">{deal.id}</div>
                    <div className="deal-product">{deal.product}</div>
                  </td>

                  <td>
                    <div className="customer-name">{deal.customer}</div>
                  </td>

                  <td>
                    <div className="owner-cell">
                      <div className="owner-avatar">
                        {deal.owner.charAt(0)}
                      </div>
                      {deal.owner}
                    </div>
                  </td>

                  <td>
                    <strong className="deal-value">{deal.value}</strong>
                  </td>

                  <td>
                    <span className={`status-pill ${statusClass[deal.status]}`}>
                      {deal.status}
                    </span>
                  </td>

                  <td>
                    <span className={`risk-pill ${riskClass[deal.risk]}`}>
                      <span className="risk-dot"></span>
                      {deal.risk}
                    </span>
                  </td>

                  <td className="updated-cell">{deal.updated}</td>

                  <td>
                    <button className="icon-button">
                      <MoreHorizontal size={19} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing 5 of 42 deals</span>

          <div className="pagination">
            <button disabled>Previous</button>
            <button className="active-page">1</button>
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Deals;