-- ============================================================
-- 0004_customer_address.sql — structured address + new customer types
-- Run AFTER 0001_schema.sql in the Supabase SQL Editor.
-- All new columns are NULLABLE: safe for existing rows.
-- RLS is unchanged (no new tables).
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS country     VARCHAR(100) DEFAULT 'Indonesia';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS province    VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS province_id VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS regency     VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS regency_id  VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS district    VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS district_id VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS village     VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS village_id  VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- address (TEXT, existing) is reused as the street / address detail line.

-- Replace the old type constraint (regular|vip|reseller) with the new set.
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_type_check;
ALTER TABLE customers ALTER COLUMN type SET DEFAULT 'company';
UPDATE customers
  SET type = 'company'
  WHERE type NOT IN ('company', 'personal', 'institute', 'university', 'bumn');
ALTER TABLE customers ADD CONSTRAINT customers_type_check
  CHECK (type IN ('company', 'personal', 'institute', 'university', 'bumn'));
