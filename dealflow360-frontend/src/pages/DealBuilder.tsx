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

type DealProduct = {
productId: string;
name: string;
description: string;
price: number;
cost: number;
quantity: number;
billingType: "ONE_TIME" | "RECURRING";
};

const initialProducts: DealProduct[] = [
{
productId: "PROD-001",
name: "Enterprise Laptop",
description: "Business-grade laptop",
price: 80000,
cost: 60000,
quantity: 50,
billingType: "ONE_TIME",
},
{
productId: "PROD-002",
name: "Device Management",
description: "Endpoint management license",
price: 5000,
cost: 2000,
quantity: 50,
billingType: "RECURRING",
},
];

function DealBuilder({ onBack }: { onBack: () => void }) {
const [isEvaluating, setIsEvaluating] = useState(false);
const [products, setProducts] = useState<DealProduct[]>(initialProducts);

const [dealName, setDealName] = useState(
"Enterprise Device Modernization"
);

const [discountPercent, setDiscountPercent] = useState(18);

const [showProductForm, setShowProductForm] = useState(false);

const [newProduct, setNewProduct] = useState({
  id: "",
  name: "",
  description: "",
  category: "",
  type: "GOOD" as "GOOD" | "SERVICE",
  billing_type: "ONE_TIME" as "ONE_TIME" | "RECURRING",
  sale_price: "",
  cost_price: "",
});

const subtotal = products.reduce(
(total, product) => total + product.price * product.quantity,
0
);

const discount = subtotal * (discountPercent / 100);
const estimatedTotal = subtotal - discount;

const handleEvaluateDeal = async () => {
if (products.length === 0) {
alert("Please add at least one product to the deal.");
return;
}


if (!dealName.trim()) {
  alert("Please enter a deal name.");
  return;
}

setIsEvaluating(true);

try {
  const token = localStorage.getItem("dealflow360_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch("http://localhost:5000/api/deals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      customerId: "CUS-001",
      title: dealName.trim(),
      discountPercent,
      items: products.map((product) => ({
        productId: product.productId,
        productName: product.name,
        quantity: product.quantity,
        unitPrice: product.price,
        unitCost: product.cost,
        billingType: product.billingType,
        recurringInterval:
          product.billingType === "RECURRING" ? "MONTHLY" : null,
        discountPercent: 0,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data?.error?.message || "Deal creation failed."
    );
  }

  alert(
    `Deal created successfully!\n\n` +
      `Deal ID: ${data.data.id}\n` +
      `Status: ${data.data.status}\n` +
      `Total: ₹${Number(data.data.totalAmount).toLocaleString("en-IN")}`
  );
} catch (error) {
  console.error("Create deal error:", error);

  alert(
    error instanceof Error
      ? error.message
      : "Unable to connect to DealFlow360."
  );
} finally {
  setIsEvaluating(false);
}

};

const removeProduct = (productId: string) => {
setProducts((currentProducts) =>
currentProducts.filter(
(product) => product.productId !== productId
)
);
};

const updateQuantity = (productId: string, quantity: number) => {
setProducts((currentProducts) =>
currentProducts.map((product) =>
product.productId === productId
? {
...product,
quantity: Math.max(1, quantity),
}
: product
)
);
};

return ( <div className="page-container"> <div className="deal-builder-header"> <div> <button className="back-button" onClick={onBack}> <ArrowLeft size={17} />
Back to Deals </button>

```
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
              type="button"
              className="select-field"
              onClick={() => {
                const newProduct = initialProducts.find(
                    (product) =>
                    !products.some(
                        (existingProduct) =>
                        existingProduct.productId === product.productId
                    )
                );

                if (newProduct) {
                    setProducts((currentProducts) => [
                    ...currentProducts,
                    { ...newProduct, quantity: 1 },
                    ]);
                } else {
                    alert("All available products are already added.");
                }
                }}
            >
              <span>GOLD</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="form-field">
            <label>Deal Name</label>

            <input
              type="text"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Expected Close Date</label>

            <input
              type="date"
              defaultValue="2026-09-30"
            />
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
            type="button"
            className="secondary-button"
            onClick={() => {
                console.log("Add Product clicked");
                setShowProductForm(true);
            }}
        >
            <Plus size={16} />
            Add Product
        </button>
        </div>

        <div className="product-list">
          {products.map((product) => (
            <div
              className="product-row"
              key={product.productId}
            >
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

                <input
                  type="number"
                  value={product.quantity}
                  min="1"
                  onChange={(e) =>
                    updateQuantity(
                      product.productId,
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              <div className="product-price">
                <span>Unit Price</span>

                <strong>
                  ₹{product.price.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="product-total">
                <span>Total</span>

                <strong>
                  ₹
                  {(
                    product.price * product.quantity
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() =>
                  removeProduct(product.productId)
                }
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
              <input
                type="number"
                value={discountPercent}
                min="0"
                max="100"
                onChange={(e) =>
                  setDiscountPercent(
                    Math.min(
                      100,
                      Math.max(0, Number(e.target.value))
                    )
                  )
                }
              />

              <span>%</span>
            </div>
          </div>

          <div className="form-field">
            <label>Payment Terms</label>

            <button
              type="button"
              className="select-field"
              onClick={() =>
                alert("Payment terms selection will open here.")
              }
            >
              <span>Net 30</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="form-field">
            <label>Billing Type</label>

            <button
              type="button"
              className="select-field"
              onClick={() =>
                alert("Billing type selection will open here.")
              }
            >
              <span>Hybrid</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </section>
    {showProductForm && (
  <div className="builder-card">
    <div className="builder-card-header">
      <div>
        <h2>Add New Product</h2>
        <p>Enter the product details to save it to the DealFlow360 database.</p>
      </div>
    </div>

    <div className="builder-form-grid">
      <div className="form-field">
        <label>Product ID</label>
        <input
          type="text"
          placeholder="e.g. PROD-003"
          value={newProduct.id}
          onChange={(e) =>
            setNewProduct({ ...newProduct, id: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Product Name</label>
        <input
          type="text"
          placeholder="e.g. Wireless Keyboard"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Description</label>
        <input
          type="text"
          placeholder="Product description"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Category</label>
        <input
          type="text"
          placeholder="e.g. Hardware"
          value={newProduct.category}
          onChange={(e) =>
            setNewProduct({ ...newProduct, category: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Type</label>
        <select
          value={newProduct.type}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              type: e.target.value as "GOOD" | "SERVICE",
            })
          }
        >
          <option value="GOOD">Good</option>
          <option value="SERVICE">Service</option>
        </select>
      </div>

      <div className="form-field">
        <label>Billing Type</label>
        <select
          value={newProduct.billing_type}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              billing_type: e.target.value as "ONE_TIME" | "RECURRING",
            })
          }
        >
          <option value="ONE_TIME">One Time</option>
          <option value="RECURRING">Recurring</option>
        </select>
      </div>

      <div className="form-field">
        <label>Sale Price</label>
        <input
          type="number"
          placeholder="e.g. 25000"
          value={newProduct.sale_price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, sale_price: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Cost Price</label>
        <input
          type="number"
          placeholder="e.g. 18000"
          value={newProduct.cost_price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, cost_price: e.target.value })
          }
        />
      </div>
    </div>

    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
      <button
        type="button"
        className="secondary-button"
        onClick={() => setShowProductForm(false)}
      >
        Cancel
      </button>

      <button
  type="button"
  className="evaluate-button"
  onClick={async () => {
    if (
      !newProduct.id.trim() ||
      !newProduct.name.trim() ||
      !newProduct.category.trim() ||
      !newProduct.sale_price ||
      !newProduct.cost_price
    ) {
      alert("Please fill all required product fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error?.message || "Unable to save product."
        );
      }

      const savedProduct: DealProduct = {
        productId: data.data.id,
        name: data.data.name,
        description: data.data.description || "",
        price: Number(data.data.sale_price),
        cost: Number(data.data.cost_price),
        quantity: 1,
        billingType: data.data.billing_type,
      };

      setProducts((currentProducts) => [
        ...currentProducts,
        savedProduct,
      ]);

      setNewProduct({
        id: "",
        name: "",
        description: "",
        category: "",
        type: "GOOD",
        billing_type: "ONE_TIME",
        sale_price: "",
        cost_price: "",
      });

      setShowProductForm(false);

      alert("Product saved successfully!");
    } catch (error) {
      console.error("Save product error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save product."
      );
    }
  }}
>
  Save Product
</button>
    </div>
  </div>
)}
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

          <strong>
            ₹{subtotal.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-line discount-line">
          <span>Requested Discount</span>

          <strong>
            -₹{discount.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-divider"></div>

        <div className="summary-total">
          <span>Estimated Deal Value</span>

          <strong>
            ₹{estimatedTotal.toLocaleString("en-IN")}
          </strong>
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
          type="button"
          className="evaluate-button"
          onClick={handleEvaluateDeal}
          disabled={isEvaluating || products.length === 0}
        >
          {isEvaluating ? "Creating Deal..." : "Create Deal"}
        </button>

        <button
          type="button"
          className="save-draft-button"
          onClick={() =>
            alert("Deal draft saved successfully!")
          }
        >
          Save Draft
        </button>
      </div>

      <div className="builder-tip-card">
        <span>DEAL INTELLIGENCE</span>

        <h3>What happens next?</h3>

        <p>
          Once created, DealFlow360 can evaluate the deal, determine
          approvals, assess risk and continue the fulfillment workflow.
        </p>
      </div>
    </aside>
  </div>
</div>


);
}

export default DealBuilder;
