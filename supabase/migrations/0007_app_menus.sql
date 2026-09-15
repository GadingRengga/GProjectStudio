-- ============================================================
-- 0007_app_menus.sql — dynamic sidebar menu (schema ONLY, no data)
-- Run AFTER 0006_access_control.sql in the Supabase SQL Editor.
-- Data lives in supabase/seeders/002_app_menus.sql (never here).
-- Scope: one row = one sidebar item OR one accordion parent.
--   - Leaf item:  path NOT NULL (e.g. '/customers').
--   - Parent:     path IS NULL, children point via parent_key.
-- Frontend maps `icon` (string) to a component in useMenu.ts.
-- Role filtering is Layer 1 (useMenu + usePermission); the real data
-- gate stays in each module's RLS policy (docs/ARCHITECTURE.md).
-- ============================================================

-- ============================================================
-- APP_MENUS
-- ============================================================
CREATE TABLE app_menus (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT UNIQUE NOT NULL,   -- stable id for idempotent seeding, e.g. 'erp.customers.list'
  group_title   TEXT NOT NULL,          -- sidebar group heading: 'Main' | 'ERP Modules' | 'Administration'
  label         TEXT NOT NULL,          -- visible text: 'All Customers'
  path          TEXT,                   -- list-index route only (docs/COMPONENTS.md); NULL = accordion parent
  icon          TEXT,                   -- icon component name string, e.g. 'UserCircleIcon'
  parent_key    TEXT REFERENCES app_menus(key) ON DELETE CASCADE,
  resource      TEXT,                   -- usePermission resource for read-gating, e.g. 'customers'; NULL = no gate
  allowed_roles TEXT[] NOT NULL DEFAULT '{admin,staff,viewer}',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT app_menus_no_self_parent CHECK (key != parent_key),
  CONSTRAINT app_menus_roles_valid CHECK (allowed_roles <@ ARRAY['admin', 'staff', 'viewer']::TEXT[])
);

CREATE INDEX idx_app_menus_parent ON app_menus(parent_key);
CREATE INDEX idx_app_menus_active ON app_menus(is_active);
CREATE INDEX idx_app_menus_sort ON app_menus(group_title, sort_order);

-- ============================================================
-- updated_at trigger (pattern from 0001)
-- fn_update_updated_at() already exists from 0001_schema.sql
-- ============================================================
CREATE TRIGGER trg_app_menus_updated_at
  BEFORE UPDATE ON app_menus FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- ============================================================
-- RLS — menus are not sensitive data, so SELECT is open to all
-- authenticated users; the per-role filter (allowed_roles + resource)
-- happens in the frontend (Layer 1). Writes are admin-only.
-- get_my_role() already exists from 0002_rls_policies.sql.
-- ============================================================
ALTER TABLE app_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_menus_select" ON app_menus FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "app_menus_insert" ON app_menus FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "app_menus_update" ON app_menus FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "app_menus_delete" ON app_menus FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- Audit log (menu structure changes are audited)
-- fn_audit_log() already exists from 0003_audit.sql
-- ============================================================
CREATE TRIGGER audit_app_menus
  AFTER INSERT OR UPDATE OR DELETE ON app_menus
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
