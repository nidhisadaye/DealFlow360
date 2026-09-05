-- USE dealflow360;

-- INSERT INTO customers (id, name, company, email, tier, is_active) VALUES
-- ('CUST-001', 'Acme Corp', 'Acme Corporation', 'contact@acme.com', 'GOLD', TRUE),
-- ('CUST-006', 'Silver Customer', 'Silver Customer Ltd', 'silver@example.com', 'SILVER', TRUE);

-- INSERT INTO products (id, name, category, type, billing_type, sale_price, cost_price, currency, is_active) VALUES
-- ('PROD-HW-001', 'Enterprise Laptop', 'Hardware', 'GOOD', 'ONE_TIME', 100000, 70000, 'INR', TRUE),
-- ('PROD-WAR-001', 'Extended Warranty', 'Services', 'SERVICE', 'ONE_TIME', 10000, 4000, 'INR', TRUE),
-- ('PROD-MAINT-001', 'Maintenance Service', 'Services', 'SERVICE', 'RECURRING', 15000, 6000, 'INR', TRUE),
-- ('PROD-HW-ZERO', 'Zero Inventory Laptop', 'Hardware', 'GOOD', 'ONE_TIME', 100000, 70000, 'INR', TRUE);

-- INSERT INTO warehouses (id, name, location, is_active) VALUES
-- ('WH-MUM', 'Mumbai Warehouse', 'Mumbai', TRUE),
-- ('WH-PUN', 'Pune Warehouse', 'Pune', TRUE);

-- INSERT INTO inventory (id, warehouse_id, product_id, available_quantity, reserved_quantity) VALUES
-- ('INV-001', 'WH-MUM', 'PROD-HW-001', 6, 0),
-- ('INV-002', 'WH-PUN', 'PROD-HW-001', 2, 0);

-- INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
-- ('USER-001', 'Sales Representative', 'sales@acme.com', '$2b$10$BWU5ngsCzoHft1iGLG3UEuumSllxCwpLOA4E6fDcVZ.DMVrBL0wsa', 'SALES_REP', TRUE);

-- INSERT INTO discount_rules
-- 	(id, name, customer_tier, product_category, max_discount_percent, requires_approval_above, is_active)
-- VALUES
-- 	('RULE-GOLD', 'Gold Customer Limit', 'GOLD', NULL, 15, 15, TRUE),
-- 	('RULE-HARDWARE', 'Hardware Discount Limit', NULL, 'Hardware', 15, 15, TRUE);

-- INSERT INTO upsell_rules
-- 	(id, source_category, target_name_keywords, reason, confidence, is_active)
-- VALUES
-- 	('UPSELL-HW-WAR', 'Hardware', '["extended warranty"]', 'Recommended protection for hardware purchase.', 0.900, TRUE),
-- 	('UPSELL-HW-MNT', 'Hardware', '["maintenance service"]', 'Recommended maintenance service for hardware.', 0.750, TRUE),
-- 	('UPSELL-SW-IMP', 'Software', '["implementation service"]', 'Recommended implementation support for software.', 0.900, TRUE),
-- 	('UPSELL-SW-SUP', 'Software', '["support service"]', 'Recommended support coverage for software.', 0.750, TRUE);

-- INSERT INTO deals
-- 	(id, customer_id, sales_rep_id, title, status, discount_percent, subtotal,
-- 	 discount_amount, total_amount, cost_amount, margin_amount, margin_percent, currency)
-- VALUES
-- 	('DEAL-001', 'CUST-001', 'USER-001', 'Acme Enterprise Laptop Deal', 'UNDER_REVIEW',
-- 	 18, 1000000, 180000, 820000, 700000, 120000, 14.63, 'INR');

-- INSERT INTO deal_items
-- 	(id, deal_id, product_id, product_name, quantity, unit_price, unit_cost,
-- 	 billing_type, discount_percent, subtotal, total)
-- VALUES
-- 	('ITEM-001', 'DEAL-001', 'PROD-HW-001', 'Enterprise Laptop', 10, 100000,
-- 	 70000, 'ONE_TIME', 18, 1000000, 820000);

-- INSERT INTO deals
-- 	(id, customer_id, sales_rep_id, title, status, discount_percent, subtotal,
-- 	 discount_amount, total_amount, cost_amount, margin_amount, margin_percent, currency)
-- VALUES
-- 	('DEAL-002', 'CUST-001', 'USER-001', 'Acme Standard Hardware Deal', 'UNDER_REVIEW',
-- 	 10, 500000, 50000, 450000, 350000, 100000, 22.22, 'INR'),
-- 	('DEAL-003', 'CUST-001', 'USER-001', 'Acme Negative Margin Deal', 'UNDER_REVIEW',
-- 	 10, 500000, 50000, 450000, 600000, -150000, -33.33, 'INR'),
-- 	('DEAL-004', 'CUST-001', 'USER-001', 'Acme Zero Inventory Deal', 'UNDER_REVIEW',
-- 	 10, 500000, 50000, 450000, 350000, 100000, 22.22, 'INR'),
-- 	('DEAL-005', 'CUST-001', 'USER-001', 'Acme No Active Warehouses Deal', 'UNDER_REVIEW',
-- 	 10, 500000, 50000, 450000, 350000, 100000, 22.22, 'INR'),
-- 	('DEAL-006', 'CUST-006', 'USER-001', 'Acme Missing Tier Rule Deal', 'UNDER_REVIEW',
-- 	 10, 500000, 50000, 450000, 350000, 100000, 22.22, 'INR'),
-- 	('DEAL-007', 'CUST-001', 'USER-001', 'Acme Re-Evaluation Deal', 'UNDER_REVIEW',
-- 	 18, 1000000, 180000, 820000, 700000, 120000, 14.63, 'INR');

-- INSERT INTO deal_items
-- 	(id, deal_id, product_id, product_name, quantity, unit_price, unit_cost,
-- 	 billing_type, discount_percent, subtotal, total)
-- VALUES
-- 	('ITEM-002', 'DEAL-002', 'PROD-HW-001', 'Enterprise Laptop', 5, 100000, 70000, 'ONE_TIME', 10, 500000, 450000),
-- 	('ITEM-003', 'DEAL-003', 'PROD-HW-001', 'Enterprise Laptop', 5, 100000, 120000, 'ONE_TIME', 10, 500000, 450000),
-- 	('ITEM-004', 'DEAL-004', 'PROD-HW-ZERO', 'Zero Inventory Laptop', 5, 100000, 70000, 'ONE_TIME', 10, 500000, 450000),
-- 	('ITEM-005', 'DEAL-005', 'PROD-HW-001', 'Enterprise Laptop', 5, 100000, 70000, 'ONE_TIME', 10, 500000, 450000),
-- 	('ITEM-006', 'DEAL-006', 'PROD-HW-001', 'Enterprise Laptop', 5, 100000, 70000, 'ONE_TIME', 10, 500000, 450000),
-- 	('ITEM-007', 'DEAL-007', 'PROD-HW-001', 'Enterprise Laptop', 10, 100000, 70000, 'ONE_TIME', 18, 1000000, 820000);

-- INSERT INTO deal_warehouses (deal_id, warehouse_id, is_active) VALUES
-- ('DEAL-005', 'WH-MUM', FALSE),
-- ('DEAL-005', 'WH-PUN', FALSE);

USE dealflow360;

INSERT INTO customers (id, name, company, email, tier, is_active) VALUES
('CUS-001', 'Rajesh Kumar', 'Tata Technologies', 'rajesh@tatatech.com', 'GOLD', TRUE);

INSERT INTO products (id, name, category, type, billing_type, sale_price, cost_price, currency, is_active) VALUES
('PROD-001', 'Enterprise Laptop', 'Hardware', 'GOOD', 'ONE_TIME', 80000, 60000, 'INR', TRUE),
('PROD-002', 'Device Management', 'Services', 'SERVICE', 5000, 2000, 'INR', TRUE);

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
