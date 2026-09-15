-- ============================================================
-- 0006_access_control.sql
-- Access Control: admin-only user directory + role-management guards.
--
-- WHY THIS MIGRATION EXISTS
--   The "Users & Roles" module must display auth.users.email, but auth.users is
--   NOT reachable from the client: Supabase/PostgREST only exposes the `public`
--   schema, so a client-side query can never read it.
--
--   Two options were considered:
--     (a) a security_invoker view over a mirrored email table — stores a
--         DUPLICATE copy of every email that silently goes stale;
--     (b) a SECURITY DEFINER function that reads auth.users directly and gates
--         access inside its own body.
--   (b) was chosen: one source of truth, no duplicated data.
--
-- SECURITY MODEL — all three rules are mandatory on every function below:
--   1. The admin gate lives INSIDE the function body. SECURITY DEFINER bypasses
--      RLS, so the function itself IS the security boundary. Same principle as
--      docs/SECURITY-RLS.md, expressed in SQL instead of in a policy.
--   2. search_path is pinned, so a definer function cannot be hijacked by a
--      caller who plants objects earlier on the search path.
--   3. EXECUTE is revoked from PUBLIC and granted only to `authenticated`.
--      Safe by default — an anonymous caller cannot even reach these.
--   The frontend gate (usePermission + route meta.roles) is Layer 1 only.
--   These functions are Layer 2. Both are required; neither replaces the other.
--
-- Depends on: 0002 (user_roles + get_my_role) and 0003 (audit_logs triggers).
-- Run in the Supabase SQL Editor AFTER 0005_organization.sql.
-- ============================================================


-- ============================================================
-- 1. list_app_users() — paginated, searchable, sortable directory
-- ============================================================
-- Role is returned NULLABLE on purpose: a user with no row in user_roles has NO
-- access at all (get_my_role() returns NULL and every RLS policy fails). Coercing
-- that to 'viewer' would misreport a locked-out account as a read-only one, so
-- the UI renders "No access" instead.
--
-- Sorting: ORDER BY cannot be parameterised in SQL, so every supported column is
-- whitelisted explicitly via CASE. An unknown p_sort_by silently falls back to
-- created_at DESC. No dynamic SQL is built, therefore there is no injection
-- surface even though p_sort_by is attacker-controlled input.
CREATE OR REPLACE FUNCTION list_app_users(
  p_page      INTEGER DEFAULT 1,
  p_per_page  INTEGER DEFAULT 15,
  p_search    TEXT    DEFAULT NULL,
  p_sort_by   TEXT    DEFAULT 'created_at',
  p_sort_dir  TEXT    DEFAULT 'desc'
)
RETURNS TABLE (
  user_id         UUID,
  email           TEXT,
  role            VARCHAR,
  created_at      TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  total_count     BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email::TEXT,
    r.role,
    u.created_at,
    u.last_sign_in_at,
    COUNT(*) OVER ()          -- full match count, evaluated BEFORE LIMIT
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE public.get_my_role() = 'admin'
    AND (p_search IS NULL OR u.email ILIKE '%' || p_search || '%')
  ORDER BY
    CASE WHEN p_sort_by = 'email'      AND p_sort_dir = 'asc'  THEN u.email      END ASC,
    CASE WHEN p_sort_by = 'email'      AND p_sort_dir = 'desc' THEN u.email      END DESC,
    CASE WHEN p_sort_by = 'role'       AND p_sort_dir = 'asc'  THEN r.role       END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'role'       AND p_sort_dir = 'desc' THEN r.role       END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'asc'  THEN u.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'desc' THEN u.created_at END DESC,
    u.created_at DESC
  LIMIT  GREATEST(p_per_page, 1)
  OFFSET GREATEST((p_page - 1) * p_per_page, 0)
$$;

REVOKE ALL     ON FUNCTION list_app_users(INTEGER, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION list_app_users(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;


-- ============================================================
-- 2. get_app_user() — single user, for the Detail view (direct URL access)
-- ============================================================
-- The Detail view must survive a hard refresh / pasted URL, so it cannot rely on
-- row data handed over from the List view.
CREATE OR REPLACE FUNCTION get_app_user(p_user_id UUID)
RETURNS TABLE (
  user_id         UUID,
  email           TEXT,
  role            VARCHAR,
  created_at      TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email::TEXT,
    r.role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.id = p_user_id
    AND public.get_my_role() = 'admin'
$$;

REVOKE ALL     ON FUNCTION get_app_user(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_app_user(UUID) TO authenticated;


-- ============================================================
-- 3. get_user_stats() — SummaryCard + TrendChart in one round trip
-- ============================================================
-- Exact counts in a single query. The alternative (reusing list_app_users with a
-- huge per_page and counting in TypeScript) silently breaks once the company grows
-- past whatever page size was hardcoded, so the count is pushed into the database.
--
-- Note the gate is not only a filter: for a non-admin this returns ZERO ROWS
-- rather than a row of zeros. The repository treats "no row" as an authorisation
-- failure instead of rendering a misleading 0 / 0 / 0 / 0 summary.
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  admins      BIGINT,
  staffs      BIGINT,
  viewers     BIGINT,
  no_access   BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE r.role = 'admin'),
    COUNT(*) FILTER (WHERE r.role = 'staff'),
    COUNT(*) FILTER (WHERE r.role = 'viewer'),
    COUNT(*) FILTER (WHERE r.role IS NULL)
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE public.get_my_role() = 'admin'
$$;

REVOKE ALL     ON FUNCTION get_user_stats() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_user_stats() TO authenticated;


-- ============================================================
-- 4. Last-admin guard — an invariant RLS cannot express
-- ============================================================
-- Without this, an admin can demote themselves (or the only admin) and role
-- management is locked out PERMANENTLY: nobody is left who can write user_roles,
-- and fixing it requires direct database access. That is a self-inflicted lockout
-- whose blast radius is total, so it is refused at the database level rather than
-- merely hidden in the UI. Same shape of guard as fn_prevent_org_cycle() in 0005.
CREATE OR REPLACE FUNCTION fn_prevent_last_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  -- Only rows that ARE admin and are being removed/demoted need guarding.
  IF OLD.role <> 'admin' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Still an admin after the update — nothing to guard.
  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Serialise the check. Two concurrent demotions would otherwise both read
  -- "2 admins exist" and both commit, leaving zero — a classic check-then-act race.
  PERFORM pg_advisory_xact_lock(hashtext('user_roles:last_admin_guard'));

  SELECT COUNT(*) INTO v_admin_count FROM public.user_roles WHERE role = 'admin';

  IF v_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin — assign another admin first.';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_roles_last_admin ON user_roles;
CREATE TRIGGER trg_user_roles_last_admin
  BEFORE UPDATE OF role OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_last_admin_removal();
