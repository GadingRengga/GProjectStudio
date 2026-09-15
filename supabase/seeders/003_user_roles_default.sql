-- ============================================================
-- 003_user_roles_default.sql — map default users to app roles
-- Idempotent: safe to re-run (ON CONFLICT (user_id) DO UPDATE).
-- PREREQUISITE: create the three users FIRST via Dashboard
--   Authentication → Users → Add user (auto-confirm):
--     admin@erp.local / staff@erp.local / viewer@erp.local
--   (passwords are set manually there — never stored in this repo).
-- Must run as DB owner in the SQL Editor (reads auth.users);
-- it cannot run from the client anon key.
-- Admin is upserted FIRST so the last-admin guard trigger
-- (0006_access_control.sql) never sees zero admins mid-seed.
-- ============================================================

DO $$
DECLARE
  v_admin_id  UUID;
  v_staff_id  UUID;
  v_viewer_id UUID;
BEGIN
  SELECT id INTO v_admin_id  FROM auth.users WHERE email = 'admin@erp.local';
  SELECT id INTO v_staff_id  FROM auth.users WHERE email = 'staff@erp.local';
  SELECT id INTO v_viewer_id FROM auth.users WHERE email = 'viewer@erp.local';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE '003 seed skipped: auth user admin@erp.local not found — create it via Dashboard first.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  IF v_staff_id IS NULL THEN
    RAISE NOTICE '003 seed skipped: auth user staff@erp.local not found — create it via Dashboard first.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_staff_id, 'staff')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  IF v_viewer_id IS NULL THEN
    RAISE NOTICE '003 seed skipped: auth user viewer@erp.local not found — create it via Dashboard first.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_viewer_id, 'viewer')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;
