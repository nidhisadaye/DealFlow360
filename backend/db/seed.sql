USE dealflow360;

INSERT INTO customers (id, name, company, email, tier, is_active) VALUES
('CUS-001', 'Rajesh Kumar', 'Tata Technologies', 'rajesh@tatatech.com', 'GOLD', TRUE);

INSERT INTO products (id, name, category, type, billing_type, sale_price, cost_price, currency, is_active) VALUES
('PROD-001', 'Enterprise Laptop', 'Hardware', 'GOOD', 'ONE_TIME', 80000, 60000, 'INR', TRUE),
('PROD-002', 'Device Management', 'Services', 'SERVICE', 'RECURRING', 5000, 2000, 'INR', TRUE);

INSERT INTO warehouses (id, name, location, is_active) VALUES
('WH-001', 'Mumbai Warehouse', 'Mumbai', TRUE),
('WH-002', 'Pune Warehouse', 'Pune', TRUE);

INSERT INTO inventory (id, warehouse_id, product_id, available_quantity, reserved_quantity) VALUES
('INV-001', 'WH-001', 'PROD-001', 6, 0),
('INV-002', 'WH-002', 'PROD-001', 2, 0),
('INV-003', 'WH-001', 'PROD-002', 20, 0);

INSERT INTO deals (id, customer_id, sales_rep_id, title, status, discount_percent, subtotal, discount_amount, total_amount, cost_amount, margin_amount, margin_percent, risk_score, risk_level, currency)
WITH RECURSIVE seq (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 200
)
SELECT
  CONCAT('DEAL-DEMO-', LPAD(n, 4, '0')),
  (SELECT id FROM customers ORDER BY RAND() LIMIT 1),
  (SELECT id FROM users WHERE role = 'SALES_REP' ORDER BY RAND() LIMIT 1),
  CONCAT('Demo Deal #', n),
  ELT(1 + FLOOR(RAND()*5), 'DRAFT','UNDER_REVIEW','APPROVAL_REQUIRED','APPROVED','FULFILLMENT_PENDING'),
  ROUND(5 + RAND()*20, 2),
  ROUND(50000 + RAND()*200000, 2),
  0,
  0,
  0,
  0,
  0,
  FLOOR(RAND()*100),
  ELT(1 + FLOOR(RAND()*4), 'LOW','MEDIUM','HIGH','CRITICAL'),
  'INR'
FROM seq;
