-- ============================================================
-- 001_company_profile.sql — seed singleton company profile
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING).
-- NOTE: 0005_organization.sql already inserts this row inline for
-- historical reasons (migrations are immutable, so it stays there);
-- this seeder covers fresh environments where 0005 predates the
-- seeders/ split, and any re-seed after a wipe.
-- ============================================================

INSERT INTO company_profile (id, name, country)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Company', 'Indonesia')
ON CONFLICT (id) DO NOTHING;
