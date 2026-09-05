import { PackageCheck, Truck, Warehouse } from "lucide-react";

function Fulfillment() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h1>Warehouse Fulfillment</h1>
          <p>Monitor inventory allocation, shipments, and delivery progress.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <PackageCheck size={20} />
          </div>
          <span>Pending Fulfillment</span>
          <strong>12</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Warehouse size={20} />
          </div>
          <span>Warehouse Allocations</span>
          <strong>8</strong>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={20} />
          </div>
          <span>In Transit</span>
          <strong>24</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Active Fulfillment</h2>
            <p>Current orders moving through warehouse operations.</p>
          </div>
        </div>

        <div className="empty-state">
          <PackageCheck size={42} />
          <h3>Fulfillment workspace ready</h3>
          <p>
            Warehouse allocation and shipment decisions will appear here once
            connected to the backend.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Fulfillment;