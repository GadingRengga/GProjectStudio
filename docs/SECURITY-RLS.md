> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## 🔒 Security Layer — Row Level Security (RLS)

### User Roles Table

```sql
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
```

### Enable RLS on All Tables

```sql
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
```

### RLS Policies Per Table

```sql
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
```

---

## 🎯 Advanced RLS Patterns — Row Ownership

The base policies above are role-only (any `staff` can touch any row). Real ERPs usually also need **row ownership** — e.g. a staff member can only edit the orders they created, or only customers assigned to them. Two common patterns:

### Pattern A: "Own records only" (staff edits only what they created)

```sql
-- Staff can UPDATE only orders they created; admin can update any order.
-- Replaces the simpler "orders_update" policy shown earlier when ownership matters.
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'staff' AND created_by = auth.uid())
  );
```

### Pattern B: Assigned-customer ownership (staff sees only their assigned customers)

```sql
-- Add an assignment column
ALTER TABLE customers ADD COLUMN assigned_staff_id UUID REFERENCES auth.users(id);

-- Staff can only see/edit customers assigned to them; admin sees all
DROP POLICY IF EXISTS "customers_select" ON customers;
CREATE POLICY "customers_select" ON customers FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'staff' AND assigned_staff_id = auth.uid())
    OR get_my_role() = 'viewer'  -- viewers keep read-all, adjust if not desired
  );

DROP POLICY IF EXISTS "customers_update" ON customers;
CREATE POLICY "customers_update" ON customers FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'staff' AND assigned_staff_id = auth.uid())
  );
```

### Pattern C: Column-level protection via a view (for sensitive columns)

Use when a role should see *most* columns of a row but not a sensitive one (e.g. a future `employee_salary` field). RLS cannot filter columns, so expose a restricted view instead of the raw table to that role:

```sql
CREATE VIEW customers_public AS
  SELECT id, code, name, email, phone, type, is_active  -- omit sensitive columns
  FROM customers;

ALTER VIEW customers_public SET (security_invoker = true);  -- view respects caller's RLS, not the view owner's
```

Repositories for roles that should not see the sensitive column query `customers_public` instead of `customers`.

**Rule of thumb:** default to role-only policies (simpler, matches the base schema above). Only add ownership columns (`created_by`, `assigned_staff_id`) and the corresponding policies when a module actually requires "mine vs. everyone's" access — don't add ownership columns speculatively.

---

## 🧪 Testing RLS Policies (Do This Before Every Merge)

Because there is no backend, an untested RLS policy is the single biggest risk in this architecture. Test every new/changed policy against all three roles before considering the work done.

### Method 1 — Impersonate a role in the Supabase SQL Editor

```sql
-- Simulate being a specific authenticated user for one query.
-- Replace the UUID with a real test user's id from auth.users / user_roles.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Now run the exact query your repository would run, and check the row count/content
SELECT * FROM customers;

-- Reset back to your own session
RESET ROLE;
```

Do this once per role (`admin`, `staff`, `viewer`) per table, for each of SELECT/INSERT/UPDATE/DELETE that has a policy. Confirm:
1. The expected rows (and only those rows) come back for SELECT.
2. INSERT/UPDATE/DELETE succeed for roles that should be allowed and are **rejected** (not silently no-op) for roles that shouldn't.

### Method 2 — A repeatable test checklist per table (copy this into the PR/commit description)

```
Table: ____________
[ ] admin  — SELECT returns all expected rows
[ ] staff  — SELECT returns only rows staff should see (or all, if role-only)
[ ] viewer — SELECT returns only what viewer should see
[ ] staff  — INSERT succeeds
[ ] viewer — INSERT is rejected
[ ] staff  — UPDATE succeeds only on rows staff is allowed to touch
[ ] staff  — UPDATE on someone else's row is rejected (if ownership applies)
[ ] only admin — DELETE succeeds; staff/viewer DELETE is rejected
[ ] Ran with RLS enabled (not as postgres/service_role, which bypasses RLS)
```

**Important:** never test with the Supabase `service_role` key or as the `postgres` user — both bypass RLS entirely, so a passing test under those roles proves nothing about real client behavior.

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
