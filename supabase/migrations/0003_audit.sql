-- ============================================================================
-- 0003_audit.sql — Append-only audit log + audit trigger
-- Source of truth: docs/DATABASE.md "Audit Log" section.
-- Note: audit triggers log WHAT changed — they are record-keeping, NOT access
-- control. Access control is the RLS policies in 0002 (docs/ARCHITECTURE.md #6).
-- ============================================================================

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
DECLARE
  v_record_id UUID;
BEGIN
  -- Generic PK lookup: most tables use "id", but user_roles uses "user_id".
  -- to_jsonb() field access returns NULL (not an error) for missing keys,
  -- unlike direct NEW.id / OLD.id access which raises 42703.
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(
      (to_jsonb(OLD) ->> 'id')::uuid,
      (to_jsonb(OLD) ->> 'user_id')::uuid
    );
  ELSE
    v_record_id := COALESCE(
      (to_jsonb(NEW) ->> 'id')::uuid,
      (to_jsonb(NEW) ->> 'user_id')::uuid
    );
  END IF;

  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
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
