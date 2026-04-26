-- ═══════════════════════════════════════════════════════════
-- DRIVERS CONNECT CRM — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ═══════════════════════════════════════════════════════════

-- ═══════ UTILITY: auto updated_at ═══════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════ DRIVERS ═══════
CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  initials VARCHAR(4),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(30),
  employment_type VARCHAR(20) DEFAULT 'self-employed',
  licence_category VARCHAR(20),
  licence_number VARCHAR(30),
  cpc_number VARCHAR(30),
  cpc_expiry DATE,
  tacho_card VARCHAR(30),
  rtw_type VARCHAR(20),
  rtw_expiry DATE,
  share_code VARCHAR(30),
  utr_number VARCHAR(20),
  ni_number VARCHAR(20),
  tax_code VARCHAR(10),
  status VARCHAR(20) DEFAULT 'available',
  notes TEXT,
  avatar_color VARCHAR(10) DEFAULT '#e8f1fb',
  avatar_text_color VARCHAR(10) DEFAULT '#185fa5',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════ COMPANIES ═══════
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(30),
  address TEXT,
  licence_required VARCHAR(20),
  rate_per_hour DECIMAL(8,2) DEFAULT 0,
  payment_terms_days INT DEFAULT 14,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  avatar_color VARCHAR(10) DEFAULT '#e8f1fb',
  avatar_text_color VARCHAR(10) DEFAULT '#185fa5',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════ ORDERS ═══════
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_ref VARCHAR(20) UNIQUE,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  placed_by VARCHAR(100),
  start_datetime TIMESTAMPTZ,
  start_address TEXT,
  end_address TEXT,
  licence_required VARCHAR(20),
  company_rate DECIMAL(8,2) DEFAULT 0,
  min_hours DECIMAL(6,2) DEFAULT 0,
  hours_done DECIMAL(6,2) DEFAULT 0,
  drivers_needed INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════ ORDER_DRIVERS (shift assignments) ═══════
CREATE TABLE IF NOT EXISTS order_drivers (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  driver_id BIGINT REFERENCES drivers(id) ON DELETE SET NULL,
  driver_rate DECIMAL(8,2) DEFAULT 14,
  hours_done DECIMAL(6,2) DEFAULT 0,
  start_address TEXT,
  status VARCHAR(20) DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════ INVOICES ═══════
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_ref VARCHAR(30) UNIQUE,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  issued_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════ PAYMENTS ═══════
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  payment_ref VARCHAR(30) UNIQUE,
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('in','out')),
  driver_id BIGINT REFERENCES drivers(id) ON DELETE SET NULL,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  pay_date DATE DEFAULT CURRENT_DATE,
  week_ending DATE,
  total_hours DECIMAL(6,2) DEFAULT 0,
  method VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════ DOCUMENTS ═══════
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id BIGINT NOT NULL,
  doc_type VARCHAR(50),
  file_name VARCHAR(200),
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════ ACTIVITY LOG ═══════
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(20),
  entity_id BIGINT,
  action VARCHAR(200),
  field_changed VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(100),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
-- AUTO REF GENERATORS (using AFTER INSERT to ensure id exists)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_order_ref()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET order_ref = 'ORD-' || LPAD(NEW.id::TEXT, 3, '0') WHERE id = NEW.id AND order_ref IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_ref ON orders;
CREATE TRIGGER set_order_ref AFTER INSERT ON orders
  FOR EACH ROW WHEN (NEW.order_ref IS NULL)
  EXECUTE FUNCTION generate_order_ref();

CREATE OR REPLACE FUNCTION generate_invoice_ref()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices SET invoice_ref = 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 3, '0') WHERE id = NEW.id AND invoice_ref IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_ref ON invoices;
CREATE TRIGGER set_invoice_ref AFTER INSERT ON invoices
  FOR EACH ROW WHEN (NEW.invoice_ref IS NULL)
  EXECUTE FUNCTION generate_invoice_ref();

CREATE OR REPLACE FUNCTION generate_payment_ref()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE payments SET payment_ref = 'PAY-' || LPAD(NEW.id::TEXT, 3, '0') WHERE id = NEW.id AND payment_ref IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_ref ON payments;
CREATE TRIGGER set_payment_ref AFTER INSERT ON payments
  FOR EACH ROW WHEN (NEW.payment_ref IS NULL)
  EXECUTE FUNCTION generate_payment_ref();

-- ═══════ AUTO INITIALS ═══════

CREATE OR REPLACE FUNCTION set_driver_initials()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initials IS NULL OR NEW.initials = '' THEN
    NEW.initials = UPPER(LEFT(NEW.first_name, 1) || LEFT(NEW.last_name, 1));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_initials ON drivers;
CREATE TRIGGER set_initials BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_driver_initials();


-- ═══════════════════════════════════════════════════════════
-- COMPUTED VIEWS (for Dashboard stats and joined data)
-- ═══════════════════════════════════════════════════════════

-- Driver stats: total shifts, hours, earnings from order_drivers
CREATE OR REPLACE VIEW driver_stats AS
SELECT
  d.id,
  d.first_name,
  d.last_name,
  COALESCE(COUNT(od.id), 0)::INT AS total_shifts,
  COALESCE(SUM(od.hours_done), 0)::DECIMAL AS total_hours,
  COALESCE(SUM(od.hours_done * od.driver_rate), 0)::DECIMAL AS total_earned,
  COALESCE(
    SUM(od.hours_done * od.driver_rate) FILTER (WHERE od.status != 'paid'),
    0
  )::DECIMAL AS pending_pay
FROM drivers d
LEFT JOIN order_drivers od ON od.driver_id = d.id
GROUP BY d.id, d.first_name, d.last_name;

-- Company stats: total orders, hours, billings
CREATE OR REPLACE VIEW company_stats AS
SELECT
  c.id,
  c.name,
  COALESCE(COUNT(o.id), 0)::INT AS total_orders,
  COALESCE(SUM(o.hours_done), 0)::DECIMAL AS total_hours,
  COALESCE(SUM(o.hours_done * o.company_rate), 0)::DECIMAL AS total_billed,
  COALESCE(
    SUM(p.amount) FILTER (WHERE p.direction = 'in'),
    0
  )::DECIMAL AS total_paid,
  COALESCE(COUNT(DISTINCT od.driver_id), 0)::INT AS driver_count
FROM companies c
LEFT JOIN orders o ON o.company_id = c.id
LEFT JOIN payments p ON p.company_id = c.id
LEFT JOIN order_drivers od ON od.order_id = o.id
GROUP BY c.id, c.name;


-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users get full CRUD (admin CRM — single-tenant)
CREATE POLICY "auth_full_drivers" ON drivers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_companies" ON companies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_orders" ON orders FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_order_drivers" ON order_drivers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_invoices" ON invoices FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_payments" ON payments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_documents" ON documents FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_activity" ON activity_log FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_drivers_order ON order_drivers(order_id);
CREATE INDEX IF NOT EXISTS idx_order_drivers_driver ON order_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_driver ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_licence ON drivers(licence_category);


-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════
-- Create in Supabase Dashboard: Storage → New bucket → "documents" (private)
-- Then add this policy:
-- INSERT: auth.uid() IS NOT NULL
-- SELECT: auth.uid() IS NOT NULL
-- DELETE: auth.uid() IS NOT NULL


-- ═══════════════════════════════════════════════════════════
-- SEED DATA (optional — run to populate with demo data)
-- ═══════════════════════════════════════════════════════════

INSERT INTO drivers (first_name, last_name, phone, email, address, emergency_contact, emergency_phone, employment_type, licence_category, licence_number, cpc_number, cpc_expiry, tacho_card, rtw_type, utr_number, status, avatar_color, avatar_text_color)
VALUES
  ('James', 'Mitchell', '07700 900123', 'james.mitchell@email.com', '14 Station Rd, Cumbernauld G67 1AB', 'Mary Mitchell', '07700 900999', 'Self-employed', 'Class 1', 'MITCHJ801094JM9JT', 'CPC-00134821', '2026-04-14', 'TC9912341', 'passport', '1234567890', 'active', '#e8f1fb', '#185fa5'),
  ('Sara', 'Ahmed', '07700 900456', 'sara.ahmed@email.com', NULL, NULL, NULL, 'PAYE', 'Class 2', NULL, NULL, '2027-06-01', NULL, 'visa', NULL, 'active', '#fef6e4', '#8a5a00'),
  ('Liam', 'Walsh', '07700 900789', NULL, NULL, NULL, NULL, 'Self-employed', '7.5T', NULL, NULL, '2028-03-01', NULL, 'passport', NULL, 'active', '#eaf5ec', '#2d7a3a'),
  ('Ahmed', 'Rashid', '07700 900321', NULL, NULL, NULL, NULL, 'PAYE', 'Class 1', NULL, NULL, '2027-01-01', NULL, 'visa', NULL, 'available', '#fef0f0', '#a32d2d'),
  ('Pete', 'Barlow', '07700 900654', NULL, NULL, NULL, NULL, 'PAYE', 'Class 2', NULL, NULL, '2027-09-01', NULL, 'passport', NULL, 'available', '#f0efed', '#555');

INSERT INTO companies (code, name, contact_name, contact_email, contact_phone, address, licence_required, rate_per_hour, payment_terms_days, avatar_color, avatar_text_color)
VALUES
  ('DHL', 'DHL Logistics', 'Mark Evans', 'rep@dhl.com', '0141 900 0001', 'Unit 5 Eurocentral ML1', 'Class 1', 20, 14, '#fef6e4', '#8a5a00'),
  ('AMZ', 'Amazon FC', 'Lisa Brown', 'lisa@amazon.co.uk', '0141 900 0002', NULL, 'Class 2', 19, 14, '#e8f1fb', '#185fa5'),
  ('TES', 'Tesco Distribution', 'Sarah Green', 'sarah@tesco.com', '0141 900 0003', NULL, '7.5T', 20, 14, '#eaf5ec', '#2d7a3a');
