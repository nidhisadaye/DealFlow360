import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  LayoutDashboard,
  LogOut,
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
import Billing from "../pages/Billing";
import CustomerPortal from "../pages/CustomerPortal";
import Reports from "../pages/Reports";
import Chatbot from "../components/Chatbot";

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
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Deals", icon: ShoppingCart },
  { label: "Approvals", icon: FileCheck2 },
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Billing", icon: CircleDollarSign },
  { label: "Customers", icon: Users },
];

const secondaryNavigation = [
  { label: "Reports", icon: FileCheck2 },
  { label: "Settings", icon: Settings },
];

const roleNavigation: Record<string, string[]> = {
  SALES_REP: ["Dashboard", "Deals", "Deal Builder", "Fulfillment", "Billing", "Customers", "Reports", "Settings"],
  SALES_MANAGER: ["Dashboard", "Deals", "Approvals", "Fulfillment", "Billing", "Customers", "Reports", "Settings"],
  FINANCE_OPERATIONS: ["Dashboard", "Deals", "Billing", "Reports", "Settings"],
  ADMIN: ["Dashboard", "Deals", "Approvals", "Fulfillment", "Billing", "Customers", "Reports", "Settings"],
  CUSTOMER: ["Dashboard", "Customers"],
};

function MainLayout() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const storedUser = localStorage.getItem("dealflow360_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  if (!user) return null;
  const allowedPages = roleNavigation[user.role] || roleNavigation.SALES_REP;
  const visibleNavigation = navigation.filter((item) => allowedPages.includes(item.label));
  const visibleSecondaryNavigation = secondaryNavigation.filter((item) => allowedPages.includes(item.label));

  const handleLogout = async () => {
    const token = localStorage.getItem("dealflow360_token");
    if (token) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    localStorage.removeItem("dealflow360_token");
    localStorage.removeItem("dealflow360_user");
    window.location.reload();
  };

  const renderSettings = () => (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: 750,
            color: "#172033",
          }}
        >
          Settings
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#718096",
            fontSize: "15px",
          }}
        >
          Manage your DealFlow360 account and workspace access.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e8edf3",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 8px 30px rgba(30, 60, 90, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            paddingBottom: "24px",
            borderBottom: "1px solid #edf1f5",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || "N"}
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                color: "#172033",
              }}
            >
              {user.name}
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#718096",
              }}
            >
              {user.email}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              padding: "18px",
              borderRadius: "14px",
              background: "#f8fafc",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 650,
                color: "#8a94a6",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "7px",
              }}
            >
              Account
            </span>

            <strong style={{ color: "#172033" }}>
              {user.name}
            </strong>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "14px",
              background: "#f8fafc",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 650,
                color: "#8a94a6",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "7px",
              }}
            >
              Role
            </span>

            <strong style={{ color: "#172033" }}>
              {user.role?.replaceAll("_", " ")}
            </strong>
          </div>
        </div>

        <div
          style={{
            marginTop: "28px",
            paddingTop: "24px",
            borderTop: "1px solid #edf1f5",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              border: "none",
              borderRadius: "11px",
              padding: "12px 18px",
              background: "#fff1f2",
              color: "#dc2626",
              fontWeight: 650,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    if (user.role === "CUSTOMER" && activePage === "Dashboard") {
      return <CustomerPortal />;
    }

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

      case "Reports":
        return <Reports />;

      case "Settings":
        return renderSettings();

      case "Dashboard":
      default:
        return <Dashboard onNavigate={handleNavigation} />;
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

          {visibleNavigation.map((item) => {
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

          <div className="nav-section-label secondary-label">
            SYSTEM
          </div>

          {visibleSecondaryNavigation.map((item) => {
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
          {allowedPages.includes("Deal Builder") && (
            <button
              className="create-deal-button"
              onClick={() => handleNavigation("Deal Builder")}
            >
              <span>+</span>
              Create Deal
            </button>
          )}

          <button className="sidebar-profile" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen}>
            <div className="profile-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "N"}
            </div>

            <div className="profile-info">
              <strong>{user.name}</strong>
              <span>{user.role?.replaceAll("_", " ")}</span>
            </div>

            <ChevronDown size={16} />
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <button onClick={() => { setProfileOpen(false); handleNavigation("Settings"); }}><Settings size={15} /> Account settings</button>
              <button className="profile-logout" onClick={handleLogout}><LogOut size={15} /> Log out</button>
            </div>
          )}
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
            <button
              className="notification-button"
              onClick={() => handleNavigation("Approvals")}
              title="Open pending approvals"
            >
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <button className="topbar-profile-button" onClick={() => setProfileOpen((current) => !current)} aria-label="Open user profile">
              <div className="topbar-avatar">{user.name?.charAt(0)?.toUpperCase() || "?"}</div>
            </button>
            {profileOpen && (
              <div className="topbar-profile-menu">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span>{user.role?.replaceAll("_", " ")}</span>
                <button onClick={handleLogout}><LogOut size={15} /> Log out</button>
              </div>
            )}
          </div>
        </header>

        <main className="content-area">{renderPage()}</main>
            </div>

      <Chatbot />
    </div>
  );
}

export default MainLayout;
