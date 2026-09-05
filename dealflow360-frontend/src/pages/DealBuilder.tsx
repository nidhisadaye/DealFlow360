import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { useState } from "react";

const products = [
  {
    name: "Enterprise Laptop",
    description: "Business-grade laptop",
    price: 78000,
    quantity: 50,
  },
  {
    name: "Device Management",
    description: "Endpoint management license",
    price: 12000,
    quantity: 50,
  },
];

function DealBuilder({ onBack }: { onBack: () => void }) {
      const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluateDeal = async () => {
    setIsEvaluating(true);

    try {
      const response = await fetch("http://localhost:5000/api/deals/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: "Tata Technologies",
          customerTier: "GOLD",
          dealName: "Enterprise Device Modernization",
          products,
          requestedDiscount: 18,
          paymentTerms: "Net 30",
          billingType: "Hybrid",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Deal evaluation failed");
      }

      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Deal evaluation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to connect to Deal Engine."
      );
    } finally {
      setIsEvaluating(false);
    }
  };
  const subtotal = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  const discount = subtotal * 0.18;
  const estimatedTotal = subtotal - discount;

  return (
    <div className="page-container">
      <div className="deal-builder-header">
        <div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={17} />
            Back to Deals
          </button>

          <p className="page-eyebrow">DEAL WORKSPACE</p>
          <h1>Create New Deal</h1>
          <p className="page-description">
            Build the quotation and submit it for intelligent evaluation.
          </p>
        </div>

        <div className="builder-status">
          <span className="draft-dot"></span>
          Draft
        </div>
      </div>

      <div className="deal-builder-layout">
        <main className="builder-main">
          <section className="builder-card">
            <div className="builder-card-header">
              <div>
                <h2>Customer Details</h2>
                <p>Select the customer and commercial tier for this deal.</p>
              </div>
              <UserRound size={20} />
            </div>

            <div className="builder-form-grid">
              <div className="form-field">
                <label>Customer</label>
                <div className="select-field">
                  <span>Tata Technologies</span>
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="form-field">
                <label>Customer Tier</label>
                <button
                    className="select-field"
                    onClick={() => alert("Customer tier selection will open here.")}
                >
                    <span>GOLD</span>
                    <ChevronDown size={16} />
                </button>
              </div>

              <div className="form-field">
                <label>Deal Name</label>
                <input
                  type="text"
                  defaultValue="Enterprise Device Modernization"
                />
              </div>

              <div className="form-field">
                <label>Expected Close Date</label>
                <input type="date" defaultValue="2026-09-30" />
              </div>
            </div>
          </section>

          <section className="builder-card">
            <div className="builder-card-header">
              <div>
                <h2>Products & Services</h2>
                <p>Add products that should be included in this quotation.</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => alert("Product selection will be added here.")}
            >
                <Plus size={16} />
                Add Product
            </button>
            </div>

            <div className="product-list">
              {products.map((product) => (
                <div className="product-row" key={product.name}>
                  <div className="product-info">
                    <div className="product-icon">
                      <FileText size={18} />
                    </div>

                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.description}</span>
                    </div>
                  </div>

                  <div className="product-quantity">
                    <label>Qty</label>
                    <input type="number" defaultValue={product.quantity} />
                  </div>

                  <div className="product-price">
                    <span>Unit Price</span>
                    <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                  </div>

                  <div className="product-total">
                    <span>Total</span>
                    <strong>
                      ₹
                      {(product.price * product.quantity).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => alert(`Remove ${product.name} from quotation?`)}
                    title={`Remove ${product.name}`}
                >
                    <Trash2 size={17} />
                </button>
                </div>
              ))}
            </div>
          </section>

          <section className="builder-card">
            <div className="builder-card-header">
              <div>
                <h2>Commercial Terms</h2>
                <p>
                  Enter the requested commercial terms. Final governance is
                  determined by the Deal Engine.
                </p>
              </div>
            </div>

            <div className="commercial-grid">
              <div className="form-field">
                <label>Requested Discount</label>
                <div className="input-with-suffix">
                  <input type="number" defaultValue="18" />
                  <span>%</span>
                </div>
              </div>

              <div className="form-field">
                <label>Payment Terms</label>
                <button
                    className="select-field"
                    onClick={() => alert("Customer selection will open here.")}
                >
                    <span>Tata Technologies</span>
                    <ChevronDown size={16} />
                </button>
              </div>

              <div className="form-field">
                <label>Billing Type</label>
                <button
                    className="select-field"
                    onClick={() => alert("Payment terms selection will open here.")}
                >
                    <span>Net 30</span>
                    <ChevronDown size={16} />
                </button>
              </div>
            </div>
            <div>
            <button
                className="select-field"
                onClick={() => alert("Billing type selection will open here.")}
            >
                <span>Hybrid</span>
                <ChevronDown size={16} />
            </button>
            </div>
          </section>
        </main>

        <aside className="builder-sidebar">
          <div className="quote-summary-card">
            <div className="quote-summary-header">
              <div>
                <span>QUOTE SUMMARY</span>
                <h2>DL-2402</h2>
              </div>

              <FileText size={21} />
            </div>

            <div className="summary-line">
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-line discount-line">
              <span>Requested Discount</span>
              <strong>-₹{discount.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Estimated Deal Value</span>
              <strong>₹{estimatedTotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="evaluation-note">
              <CheckCircle2 size={17} />
              <div>
                <strong>Ready for evaluation</strong>
                <span>
                  The Deal Engine will evaluate discount, risk, approvals and
                  other governance rules.
                </span>
              </div>
            </div>

            <button
                className="evaluate-button"
                onClick={handleEvaluateDeal}
                disabled={isEvaluating}
            >
                {isEvaluating ? "Evaluating..." : "Evaluate Deal"}
            </button>

            <button
                className="save-draft-button"
                onClick={() => alert("Deal draft saved successfully!")}
            >
                Save Draft
            </button>
          </div>

          <div className="builder-tip-card">
            <span>DEAL INTELLIGENCE</span>
            <h3>What happens next?</h3>
            <p>
              Once evaluated, DealFlow360 can return the required approval,
              risk level, recommendations and fulfillment intelligence.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default DealBuilder;