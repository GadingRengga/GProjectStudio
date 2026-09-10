-- ============================================================================
-- 0002_rls_policies.sql — Roles helper + RLS enable + per-table policies
-- Source of truth: docs/SECURITY-RLS.md
-- ⚠️ Every policy here MUST be tested per role (admin / staff / viewer) before
--    the work counts as done — see docs/SECURITY-RLS.md "Testing RLS Policies".
--    Never test as service_role or postgres (both bypass RLS).
-- ============================================================================

-- User roles table — links Supabase Auth users to application roles
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role    VARCHAR(20) NOT NULL DEFAULT 'viewer'
            CHECK (role IN ('admin', 'staff', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper function: get current user's role
-- Used in all RLS policies to avoid repetition
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS VARCHAR AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on All Tables
-- ============================================================
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CUSTOMERS — all authenticated can read, staff+ can write, only admin can delete
-- ============================================================
CREATE POLICY "customers_select" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "customers_update" ON customers FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "customers_delete" ON customers FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- SERVICES — same as customers
-- ============================================================
CREATE POLICY "services_select" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert" ON services FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "services_update" ON services FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "services_delete" ON services FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- ORDERS — all read, staff+ write, admin delete
-- ============================================================
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_items_select" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "orders_delete" ON orders FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- PROJECTS — all read, staff+ write, admin delete
-- ============================================================
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "milestones_select" ON project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- INVOICES — all read, staff+ write, admin delete
-- ============================================================
CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "invoices_delete" ON invoices FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- TRANSACTIONS (Finance) — ADMIN ONLY for all operations
-- ============================================================
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');
CREATE POLICY "transactions_delete" ON transactions FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- USER ROLES — users can only see their own role, only admin can manage
-- ============================================================
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "user_roles_manage" ON user_roles FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

