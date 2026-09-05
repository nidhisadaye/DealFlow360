import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import Dashboard from "../pages/Dashboard";
import Deals from "../pages/Deals";
import DealBuilder from "../pages/DealBuilder";
import Approvals from "../pages/Approvals";
import Fulfillment from "../pages/Fulfillment";
import  Billing  from "../pages/Billing";
import  CustomerPortal from "../pages/CustomerPortal";

type Page =
  | "Dashboard"
  | "Deals"
  | "Deal Builder"
  | "Approvals"
  | "Fulfillment"
  | "Billing"
  | "Customers"
  | "Reports"
  | "Settings";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Deals",
    icon: ShoppingCart,
  },
  {
    label: "Approvals",
    icon: FileCheck2,
  },
  {
    label: "Fulfillment",
    icon: PackageCheck,
  },
  {
    label: "Billing",
    icon: CircleDollarSign,
  },
  {
    label: "Customers",
    icon: Users,
  },
];

const secondaryNavigation = [
  {
    label: "Reports",
    icon: FileCheck2,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

function MainLayout() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "Deals":
        return <Deals onCreateDeal={() => handleNavigation("Deal Builder")} />;

      case "Deal Builder":
        return <DealBuilder onBack={() => handleNavigation("Deals")} />;

      case "Approvals":
        return <Approvals />;

      case "Fulfillment":
        return <Fulfillment />;

      case "Billing":
        return <Billing />;

      case "Customers":
        return <CustomerPortal />;

      case "Dashboard":
      default:
        return <Dashboard />;
    }
  };

  const handleNavigation = (page: Page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <CircleDollarSign size={22} />
          </div>

          <div>
            <h2>DealFlow360</h2>
            <span>Sales Operations</span>
          </div>

          <button
            className="mobile-close-button"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">WORKSPACE</div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigation(item.label as Page)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-section-label secondary-label">SYSTEM</div>

          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigation(item.label as Page)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="create-deal-button"
            onClick={() => handleNavigation("Deal Builder")}
          >
            <span>+</span>
            Create Deal
          </button>

          <div className="sidebar-profile">
            <div className="profile-avatar">N</div>

            <div className="profile-info">
              <strong>Nidhi</strong>
              <span>Sales Operations</span>
            </div>

            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div className="global-search">
              <Search size={17} />
              <input placeholder="Search deals, customers, quotations..." />
            </div>
          </div>

          <div className="topbar-actions">
            <button className="notification-button">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-avatar">N</div>
          </div>
        </header>

        <main className="content-area">{renderPage()}</main>
      </div>
    </div>
  );
}

export default MainLayout;