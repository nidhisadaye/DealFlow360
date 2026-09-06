import { FileText, Download, CheckCircle2 } from "lucide-react";

export default function Reports() {
  const handleDownload = async () => {
    const token = localStorage.getItem("dealflow360_token");
    if (!token) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reports/download", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error?.message || "Unable to download the report.");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "DealFlow360_Business_Report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to download the report.");
    }
  };

  return (
    <div
      style={{
        padding: "32px",
        minHeight: "100%",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 700,
              color: "#172033",
            }}
          >
            Reports
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            Generate and download DealFlow360 project reports.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eaf3ff",
                color: "#2563eb",
              }}
            >
              <FileText size={28} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  color: "#172033",
                }}
              >
                DealFlow360 Project Report
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Live deal performance report with discount, revenue, profit, margin and risk.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "26px",
            }}
          >
            {[
              "Project overview and objectives",
              "Features and application modules",
              "Technology stack and architecture",
              "Database design",
              "API documentation",
              "Testing, results and future scope",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#475569",
                  fontSize: "14px",
                }}
              >
                <CheckCircle2 size={17} color="#16a34a" />
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={handleDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              border: "none",
              borderRadius: "10px",
              padding: "12px 20px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Download size={18} />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}