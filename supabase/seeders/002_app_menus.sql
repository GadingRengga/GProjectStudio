-- ============================================================
-- 002_app_menus.sql — seed default sidebar menus (app_menus)
-- Idempotent: safe to re-run (ON CONFLICT (key) DO UPDATE).
-- Depends on: 0007_app_menus.sql (table + RLS) must be applied first.
-- Rules (docs/COMPONENTS.md sidebar rules):
--   - Only list-index routes are seeded (no /new, no /:id/edit).
--   - Future modules (orders/projects/invoices/finance) are seeded
--     with is_active = false placeholders so they never dead-link;
--     flip is_active to true once the list route actually exists.
--   - TailAdmin demo items (Calendar/Forms/Tables/Charts/...) are
--     intentionally NOT seeded — sidebar is ERP-only.
-- Parents must be inserted before children (parent_key FK).
-- sort_order is stable per group for sidebar ordering.
-- ============================================================

-- ---------- Group: Main (parents) ----------
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('main.dashboard', 'Main', 'Dashboard', NULL, 'GridIcon', NULL, NULL, '{admin,staff,viewer}', 10, true)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- Group: Main (children) ----------
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('main.dashboard.overview', 'Main', 'Overview', '/', NULL, 'main.dashboard', NULL, '{admin,staff,viewer}', 10, true)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- Group: ERP Modules (parents) ----------
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('erp.customers',     'ERP Modules', 'Customers',    NULL, 'UserCircleIcon', NULL, 'customers',    '{admin,staff,viewer}', 10, true),
  ('erp.services',      'ERP Modules', 'Services',     NULL, 'ListIcon',       NULL, 'services',     '{admin,staff,viewer}', 20, true),
  ('erp.organization',  'ERP Modules', 'Organization', NULL, 'UserCircleIcon', NULL, 'organization', '{admin,staff,viewer}', 30, true),
  ('erp.orders',        'ERP Modules', 'Orders',       NULL, 'DocsIcon',       NULL, 'orders',       '{admin,staff}',        40, false),
  ('erp.projects',      'ERP Modules', 'Projects',     NULL, 'DocsIcon',       NULL, 'projects',     '{admin,staff}',        50, false),
  ('erp.invoices',      'ERP Modules', 'Invoices',     NULL, 'DocsIcon',       NULL, 'invoices',     '{admin,staff}',        60, false),
  ('erp.finance',       'ERP Modules', 'Finance',      NULL, 'PieChartIcon',   NULL, 'transactions', '{admin}',              70, false)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- Group: ERP Modules (children: active routes only) ----------
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('erp.customers.list',    'ERP Modules', 'All Customers',       '/customers',    NULL, 'erp.customers',    'customers',    '{admin,staff,viewer}', 10, true),
  ('erp.services.list',     'ERP Modules', 'All Services',        '/services',     NULL, 'erp.services',     'services',     '{admin,staff,viewer}', 10, true),
  ('erp.organization.view', 'ERP Modules', 'Structure & Profile', '/organization', NULL, 'erp.organization', 'organization', '{admin,staff,viewer}', 10, true)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- Group: ERP Modules (children placeholders, inactive) ----------
-- Flip is_active to true once each list route exists (see router/routes/).
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('erp.orders.list',   'ERP Modules', 'All Orders',   '/orders',   NULL, 'erp.orders',   'orders',       '{admin,staff}', 10, false),
  ('erp.projects.list', 'ERP Modules', 'All Projects', '/projects', NULL, 'erp.projects', 'projects',     '{admin,staff}', 10, false),
  ('erp.invoices.list', 'ERP Modules', 'All Invoices', '/invoices', NULL, 'erp.invoices', 'invoices',     '{admin,staff}', 10, false),
  ('erp.finance.view',  'ERP Modules', 'Transactions', '/finance',  NULL, 'erp.finance',  'transactions', '{admin}',       10, false)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- Group: Administration ----------
INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('admin.users', 'Administration', 'Users & Roles', NULL, 'UserCircleIcon', NULL, 'users', '{admin}', 10, true)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO app_menus (key, group_title, label, path, icon, parent_key, resource, allowed_roles, sort_order, is_active)
VALUES
  ('admin.users.list', 'Administration', 'All Users', '/users', NULL, 'admin.users', 'users', '{admin}', 10, true)
ON CONFLICT (key) DO UPDATE SET
  group_title = EXCLUDED.group_title,
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  resource = EXCLUDED.resource,
  allowed_roles = EXCLUDED.allowed_roles,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
