> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

# Database — Schema & Audit Log

Run all SQL in this file, plus the RLS policies in `SECURITY-RLS.md`, in the Supabase SQL Editor in order: tables (below) → RLS policies (`SECURITY-RLS.md`) → audit log (below, bottom section).

---

## 🗄️ Database Schema

Run all SQL below in the **Supabase SQL Editor** in order.

### Core Tables

```sql
-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       VARCHAR(20) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  phone      VARCHAR(50),
  address    TEXT,
  type       VARCHAR(20) DEFAULT 'regular'
               CHECK (type IN ('regular', 'vip', 'reseller')),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  unit        VARCHAR(50),               -- hour, package, item, etc.
  base_price  NUMERIC(15,2) NOT NULL CHECK (base_price >= 0),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id  UUID NOT NULL REFERENCES customers(id),
  type         VARCHAR(20) DEFAULT 'standard'
                 CHECK (type IN ('standard', 'custom')),
  status       VARCHAR(20) DEFAULT 'draft'
                 CHECK (status IN ('draft','confirmed','in_progress','completed','cancelled')),
  notes        TEXT,
  order_date   DATE NOT NULL,
  due_date     DATE,
  total_amount NUMERIC(15,2) DEFAULT 0 CHECK (total_amount >= 0),
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id),
  description TEXT,                      -- overrides service name for custom orders
  qty         NUMERIC(10,2) NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  subtotal    NUMERIC(15,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(30) UNIQUE NOT NULL,
  order_id       UUID REFERENCES orders(id),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  status         VARCHAR(20) DEFAULT 'planning'
                   CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  start_date     DATE,
  end_date       DATE,
  progress       INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  due_date     DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order   INTEGER DEFAULT 0
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  order_id       UUID REFERENCES orders(id),
  project_id     UUID REFERENCES projects(id),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  status         VARCHAR(20) DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  issue_date     DATE NOT NULL,
  due_date       DATE NOT NULL,
  subtotal       NUMERIC(15,2) DEFAULT 0 CHECK (subtotal >= 0),
  tax_rate       NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate BETWEEN 0 AND 100),
  tax_amount     NUMERIC(15,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount   NUMERIC(15,2) DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount    NUMERIC(15,2) DEFAULT 0 CHECK (paid_amount >= 0),
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT due_after_issue CHECK (due_date >= issue_date)
);

CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty         NUMERIC(10,2) NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  subtotal    NUMERIC(15,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- ============================================================
-- FINANCE
-- ============================================================
CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category         VARCHAR(100),
  reference_type   VARCHAR(20) CHECK (reference_type IN ('invoice', 'manual', 'refund')),
  reference_id     UUID,
  amount           NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description      TEXT,
  transaction_date DATE NOT NULL,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### Auto-update `updated_at` Trigger

```sql
-- Create trigger function once, reuse for all tables
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to every table that has updated_at
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
```

---



## 📋 Audit Log (Track All Data Changes)

```sql
-- ============================================================
-- AUDIT LOGS — immutable record of all changes to sensitive tables
-- ============================================================
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id  UUID NOT NULL,
  action     VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data   JSONB,
  new_data   JSONB,
  user_id    UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs are append-only — no one can update or delete them
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);  -- trigger inserts on behalf of the user
-- No UPDATE or DELETE policy = nobody can modify audit logs

-- ============================================================
-- Trigger function — auto-logs changes to sensitive tables
-- ============================================================
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to sensitive tables
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
```

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
