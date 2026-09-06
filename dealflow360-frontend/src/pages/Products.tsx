import { useEffect, useState } from "react";
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  Boxes,
  BriefcaseBusiness,
  Repeat2,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: "GOOD" | "SERVICE";
  billing_type: "ONE_TIME" | "RECURRING";
  sale_price: number;
  cost_price: number;
  currency: string;
  is_active: number;
};

type ProductForm = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "GOOD" | "SERVICE";
  billing_type: "ONE_TIME" | "RECURRING";
  sale_price: string;
  cost_price: string;
  currency: string;
};

const emptyForm: ProductForm = {
  id: "",
  name: "",
  description: "",
  category: "",
  type: "GOOD",
  billing_type: "ONE_TIME",
  sale_price: "",
  cost_price: "",
  currency: "INR",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("dealflow360_token");

      const response = await fetch("http://localhost:5000/api/products", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    if (
      !form.id.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      !form.sale_price ||
      !form.cost_price
    ) {
      setFormError("Please fill all required fields.");
      return;
    }

    const salePrice = Number(form.sale_price);
    const costPrice = Number(form.cost_price);

    if (Number.isNaN(salePrice) || Number.isNaN(costPrice)) {
      setFormError("Sale price and cost price must be valid numbers.");
      return;
    }

    if (salePrice < 0 || costPrice < 0) {
      setFormError("Prices cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("dealflow360_token");

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        body: JSON.stringify({
          id: form.id.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          type: form.type,
          billing_type: form.billing_type,
          sale_price: salePrice,
          cost_price: costPrice,
          currency: form.currency,
          is_active: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create product."
        );
      }

      setShowAddForm(false);
      setForm(emptyForm);

      await loadProducts();
    } catch (error) {
      console.error("Error creating product:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase().trim();

    return (
      product.id.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.type.toLowerCase().includes(query)
    );
  });

  const activeProducts = products.filter((p) => p.is_active).length;

  const serviceProducts = products.filter(
    (p) => p.type === "SERVICE"
  ).length;

  const recurringProducts = products.filter(
    (p) => p.billing_type === "RECURRING"
  ).length;

  return (
    <div className="products-page">

      {/* HEADER */}
      <div className="products-header">
        <div className="products-heading">
          <div className="products-title-icon">
            <Package size={28} />
          </div>

          <div>
            <h1 className="products-title">
              Products
            </h1>

            <p className="products-subtitle">
              Manage your product and service catalog
            </p>
          </div>
        </div>

        <div className="products-actions">
          <button
            type="button"
            className="products-btn products-btn-primary"
            onClick={() => {
              setForm(emptyForm);
              setFormError("");
              setShowAddForm(true);
            }}
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="products-kpis">

        <div className="products-kpi">
          <div className="products-kpi-content">
            <div>
              <div className="products-kpi-label">
                Total Products
              </div>

              <div className="products-kpi-value">
                {products.length}
              </div>

              <div className="products-kpi-description">
                Catalog items
              </div>
            </div>

            <div className="products-kpi-icon products-kpi-blue">
              <Boxes size={21} />
            </div>
          </div>
        </div>

        <div className="products-kpi">
          <div className="products-kpi-content">
            <div>
              <div className="products-kpi-label">
                Active
              </div>

              <div className="products-kpi-value products-value-green">
                {activeProducts}
              </div>

              <div className="products-kpi-description">
                Available for deals
              </div>
            </div>

            <div className="products-kpi-icon products-kpi-green">
              <Package size={21} />
            </div>
          </div>
        </div>

        <div className="products-kpi">
          <div className="products-kpi-content">
            <div>
              <div className="products-kpi-label">
                Services
              </div>

              <div className="products-kpi-value products-value-purple">
                {serviceProducts}
              </div>

              <div className="products-kpi-description">
                Service offerings
              </div>
            </div>

            <div className="products-kpi-icon products-kpi-purple">
              <BriefcaseBusiness size={21} />
            </div>
          </div>
        </div>

        <div className="products-kpi">
          <div className="products-kpi-content">
            <div>
              <div className="products-kpi-label">
                Recurring
              </div>

              <div className="products-kpi-value products-value-orange">
                {recurringProducts}
              </div>

              <div className="products-kpi-description">
                Subscription items
              </div>
            </div>

            <div className="products-kpi-icon products-kpi-orange">
              <Repeat2 size={21} />
            </div>
          </div>
        </div>

      </div>

      {/* PRODUCT CATALOG */}
      <div className="products-catalog">

        {/* TOOLBAR */}
        <div className="products-toolbar">

          <div className="products-catalog-heading">
            <h2>
              Product Catalog
            </h2>

            <p>
              Product IDs connect Deals, Inventory and Fulfillment.
            </p>
          </div>

          <div className="products-toolbar-actions">

            <div className="products-search-wrapper">
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="products-search"
              />
            </div>

            <button
              type="button"
              onClick={loadProducts}
              className="products-refresh-btn"
              title="Refresh products"
            >
              <RefreshCw
                size={17}
                className={loading ? "products-spin" : ""}
              />
            </button>

          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="products-loading">
            <div className="products-loading-icon">
              <RefreshCw
                size={28}
                className="products-spin"
              />
            </div>

            <p>
              Loading product catalog...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (

          <div className="products-empty">
            <div className="products-empty-icon">
              <Package size={30} />
            </div>

            <p className="products-empty-title">
              No products found
            </p>

            <p className="products-empty-text">
              Try a different search term.
            </p>
          </div>

        ) : (

          <div className="products-table-wrapper">
            <table className="products-table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Billing</th>
                  <th>Sale Price</th>
                  <th>Cost</th>
                  <th>Margin</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const sale = Number(product.sale_price);
                  const cost = Number(product.cost_price);

                  const margin =
                    sale > 0
                      ? ((sale - cost) / sale) * 100
                      : 0;

                  const marginWidth = Math.min(
                    Math.max(margin, 0),
                    100
                  );

                  return (
                    <tr key={product.id}>

                      <td>
                        <div className="product-cell">

                          <div className="product-icon">
                            <Package size={20} />
                          </div>

                          <div>
                            <div className="product-name">
                              {product.name}
                            </div>

                            <div className="product-id">
                              {product.id}
                            </div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="product-category">
                          {product.category}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`product-badge ${
                            product.type === "SERVICE"
                              ? "product-badge-service"
                              : "product-badge-good"
                          }`}
                        >
                          {product.type}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            product.billing_type === "RECURRING"
                              ? "product-badge product-badge-recurring"
                              : "product-badge product-badge-onetime"
                          }
                        >
                          {product.billing_type === "RECURRING"
                            ? "Recurring"
                            : "One Time"}
                        </span>
                      </td>

                      <td>
                        <span className="product-price">
                          {product.currency}{" "}
                          {sale.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td>
                        <span className="product-cost">
                          {product.currency}{" "}
                          {cost.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td>
                        <div className="product-margin">

                          <div className="product-margin-value">
                            {margin.toFixed(1)}%
                          </div>

                          <div className="product-margin-bar">
                            <div
                              className="product-margin-fill"
                              style={{
                                width: `${marginWidth}%`,
                              }}
                            />
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            product.is_active
                              ? "product-status-active"
                              : "product-status-inactive"
                          }
                        >
                          {product.is_active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="products-footer">

            <p>
              Showing{" "}
              <strong>
                {filteredProducts.length}
              </strong>{" "}
              of{" "}
              <strong>
                {products.length}
              </strong>{" "}
              products
            </p>

            <span>
              DealFlow360 Product Catalog
            </span>

          </div>
        )}

      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddForm && (
        <div
          className="product-modal-overlay"
          onClick={() => {
            if (!saving) {
              setShowAddForm(false);
            }
          }}
        >
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="product-modal-header">
              <div>
                <h2>Add Product</h2>
                <p>
                  Add a product or service to the catalog.
                </p>
              </div>

              <button
                type="button"
                className="product-modal-close"
                onClick={() => {
                  if (!saving) {
                    setShowAddForm(false);
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={handleAddProduct}
            >

              {formError && (
                <div className="product-form-error">
                  {formError}
                </div>
              )}

              <div className="product-form-grid">

                <div className="product-form-field">
                  <label>
                    Product ID *
                  </label>

                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        id: e.target.value,
                      })
                    }
                    placeholder="e.g. PROD-003"
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>
                    Product Name *
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Business Laptop"
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>
                    Category *
                  </label>

                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    placeholder="e.g. Hardware"
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>
                    Currency
                  </label>

                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currency: e.target.value,
                      })
                    }
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="product-form-field">
                  <label>
                    Type *
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as
                          | "GOOD"
                          | "SERVICE",
                      })
                    }
                  >
                    <option value="GOOD">Good</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>

                <div className="product-form-field">
                  <label>
                    Billing Type *
                  </label>

                  <select
                    value={form.billing_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        billing_type: e.target.value as
                          | "ONE_TIME"
                          | "RECURRING",
                      })
                    }
                  >
                    <option value="ONE_TIME">
                      One Time
                    </option>

                    <option value="RECURRING">
                      Recurring
                    </option>
                  </select>
                </div>

                <div className="product-form-field">
                  <label>
                    Sale Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sale_price: e.target.value,
                      })
                    }
                    placeholder="80000"
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>
                    Cost Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cost_price: e.target.value,
                      })
                    }
                    placeholder="60000"
                    required
                  />
                </div>

              </div>

              <div className="product-form-field product-form-description">
                <label>
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the product or service..."
                  rows={3}
                />
              </div>

              <div className="product-form-actions">

                <button
                  type="button"
                  className="product-form-cancel"
                  onClick={() => {
                    if (!saving) {
                      setShowAddForm(false);
                    }
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-btn products-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="products-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Product
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}