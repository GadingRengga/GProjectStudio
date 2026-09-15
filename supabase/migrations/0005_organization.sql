-- ============================================================
-- 0005_organization.sql — company profile + org units + positions
-- Run AFTER 0004_customer_address.sql in the Supabase SQL Editor.
-- Scope: single company (singleton profile) + flexible unit hierarchy
-- (directorate/division/department/section/team) + positions per unit.
-- Employees module will FK to organization_units(id) + positions(id).
-- ============================================================

-- ============================================================
-- COMPANY_PROFILE (singleton — system identity)
-- ============================================================
CREATE TABLE company_profile (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  legal_name    VARCHAR(255),
  tagline       VARCHAR(255),
  logo_url      TEXT,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  website       VARCHAR(255),
  address       TEXT,
  country       VARCHAR(100) DEFAULT 'Indonesia',
  province      VARCHAR(100),
  province_id   VARCHAR(10),
  regency       VARCHAR(100),
  regency_id    VARCHAR(10),
  district      VARCHAR(100),
  district_id   VARCHAR(10),
  village       VARCHAR(100),
  village_id    VARCHAR(10),
  postal_code   VARCHAR(10),
  npwp          VARCHAR(50),
  nib           VARCHAR(50),
  siup          VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT company_profile_singleton CHECK (id = '00000000-0000-0000-0000-000000000001')
);

-- Seed the singleton row (upsert-safe). Admin edits it via the app.
INSERT INTO company_profile (id, name, country)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Company', 'Indonesia')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ORGANIZATION_UNITS (self-referencing hierarchy, any depth)
-- Root units (e.g. Direksi) have parent_id = NULL.
-- Level is computed via recursive CTE at query time, never stored.
-- ============================================================
CREATE TABLE organization_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'department'
              CHECK (type IN ('directorate','division','department','section','team','unit')),
  parent_id   UUID REFERENCES organization_units(id) ON DELETE RESTRICT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT organization_units_no_self_parent CHECK (id != parent_id)
);

CREATE INDEX idx_org_units_parent ON organization_units(parent_id);
CREATE INDEX idx_org_units_active ON organization_units(is_active);

-- Anti-cycle: reject a parent that is a descendant of the unit itself.
-- Needed because there is no backend to enforce this business rule.
CREATE OR REPLACE FUNCTION fn_prevent_org_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'organization_units: unit cannot be its own parent';
  END IF;
  IF EXISTS (
    WITH RECURSIVE descendants(id) AS (
      SELECT NEW.id
      UNION ALL
      SELECT u.id FROM organization_units u JOIN descendants d ON u.parent_id = d.id
    )
    SELECT 1 FROM descendants WHERE id = NEW.parent_id
  ) THEN
    RAISE EXCEPTION 'organization_units: parent would create a cycle';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_units_no_cycle
  BEFORE INSERT OR UPDATE OF parent_id ON organization_units
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_org_cycle();

-- ============================================================
-- POSITIONS (jabatan per unit — FK target for future employees)
-- ============================================================
CREATE TABLE positions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 VARCHAR(20) UNIQUE NOT NULL,
  title                VARCHAR(255) NOT NULL,
  organization_unit_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE RESTRICT,
  level                VARCHAR(20)
                       CHECK (level IN ('director','manager','supervisor','staff','intern')),
  description          TEXT,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_positions_unit ON positions(organization_unit_id);
CREATE INDEX idx_positions_active ON positions(is_active);

-- ============================================================
-- updated_at triggers (pattern from 0001)
-- fn_update_updated_at() already exists from 0001_schema.sql
-- ============================================================
CREATE TRIGGER trg_company_profile_updated_at
  BEFORE UPDATE ON company_profile FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_org_units_updated_at
  BEFORE UPDATE ON organization_units FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- ============================================================
-- RLS — same pattern as other modules (docs/SECURITY-RLS.md).
-- company_profile: read all authenticated, write admin only
-- (legal identity is sensitive).
-- units/positions: read all, write admin+staff, delete admin only.
-- get_my_role() already exists from the RLS migration.
-- ============================================================
ALTER TABLE company_profile    ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_profile_select" ON company_profile FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "company_profile_insert" ON company_profile FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "company_profile_update" ON company_profile FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
-- No DELETE policy on company_profile = singleton can never be deleted.

CREATE POLICY "org_units_select" ON organization_units FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "org_units_insert" ON organization_units FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "org_units_update" ON organization_units FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'))
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "org_units_delete" ON organization_units FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "positions_select" ON positions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "positions_insert" ON positions FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "positions_update" ON positions FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'))
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "positions_delete" ON positions FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- Audit log (sensitive: org structure changes are audited)
-- fn_audit_log() already exists from 0003_audit.sql
-- ============================================================
CREATE TRIGGER audit_company_profile
  AFTER INSERT OR UPDATE OR DELETE ON company_profile
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER audit_organization_units
  AFTER INSERT OR UPDATE OR DELETE ON organization_units
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER audit_positions
  AFTER INSERT OR UPDATE OR DELETE ON positions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
