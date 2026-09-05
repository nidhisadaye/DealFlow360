USE dealflow360;

INSERT INTO customers (id, name, company, email, tier, is_active) VALUES
('CUS-001', 'Rajesh Kumar', 'Tata Technologies', 'rajesh@tatatech.com', 'GOLD', TRUE);

INSERT INTO products (id, name, category, type, billing_type, sale_price, cost_price, currency, is_active) VALUES
('PROD-001', 'Enterprise Laptop', 'Hardware', 'GOOD', 'ONE_TIME', 80000, 60000, 'INR', TRUE),
('PROD-002', 'Device Management', 'Services', 'SERVICE', 'RECURRING', 5000, 2000, 'INR', TRUE);

INSERT INTO warehouses (id, name, location, is_active) VALUES
('WH-001', 'Mumbai Warehouse', 'Mumbai', TRUE),
('WH-002', 'Pune Warehouse', 'Pune', TRUE);