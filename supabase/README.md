# Supabase — Project Setup (Phase 0, checklist item 3)

Sources of truth: `docs/DATABASE.md`, `docs/SECURITY-RLS.md`, `docs/EDGE-FUNCTIONS-OPS.md`.

## 1. Create the project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) (or `supabase init && supabase link` if you prefer the CLI).
2. Under **Authentication → Providers**, keep **Email** enabled.

## 2. Run the migrations + seeders, in this exact order

**Aturan folder:** `migrations/` = DDL only (schema/RLS/function/trigger).
`seeders/` = DML only (data awal, idempotent, boleh di-run ulang).
Detail konvensi ada di `seeders/README.md`.

Open the **SQL Editor** and run each file top-to-bottom, one at a time:

### 2a. Migrations (wajib, sekali, berurutan)

| Order | File | Contents |
|---|---|---|
| 1 | `migrations/0001_schema.sql` | Core tables (`customers` → `transactions`) + `updated_at` triggers |
| 2 | `migrations/0002_rls_policies.sql` | `user_roles`, `get_my_role()`, RLS enable, all row-level policies |
| 3 | `migrations/0003_audit.sql` | `audit_logs` (append-only) + `fn_audit_log()` triggers |
| 4 | `migrations/0004_customer_address.sql` | Structured address + new customer types |
| 5 | `migrations/0005_organization.sql` | `company_profile` + `organization_units` + `positions` (+ legacy inline seed row, kept for history) |
| 6 | `migrations/0006_access_control.sql` | Admin-only user directory functions + last-admin guard |
| 7 | `migrations/0007_app_menus.sql` | `app_menus` table + RLS + audit trigger (**schema only, no data**) |

### 2b. Seeders (berurutan, boleh di-run ulang per environment)

| Order | File | Contents |
|---|---|---|
| 1 | `seeders/001_company_profile.sql` | Upsert singleton `company_profile` (`My Company`) |
| 2 | `seeders/002_app_menus.sql` | Upsert default sidebar menus (`app_menus`) |
| 3 | `seeders/003_user_roles_default.sql` | Upsert default roles via `auth.users` email lookup (buat user-nya dulu di Step 3) |

## 3. Create the three test users

**Authentication → Users → Add user** (email + password, auto-confirm):

- `admin@erp.local` / a strong test password
- `staff@erp.local` / a strong test password
- `viewer@erp.local` / a strong test password

Then assign their roles by running `seeders/003_user_roles_default.sql` in the
SQL Editor (it looks up the user ids by email — no UUID copy-paste needed).
Requires the users above to exist first; missing users are reported via
NOTICE and skipped. Safe to re-run.

## 4. Test every policy per role (mandatory — docs/SECURITY-RLS.md)

For each table, run the SELECT/INSERT/UPDATE/DELETE your repository will run, once per role, using the impersonation snippet from `docs/SECURITY-RLS.md` (Method 1):

```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "<user-uuid>", "role": "authenticated"}';
SELECT * FROM customers;
RESET ROLE;
```

Checklist per table (copy into the PR/commit description):

```
[ ] admin  — SELECT returns all expected rows
[ ] staff  — SELECT returns only rows staff should see (or all, if role-only)
[ ] viewer — SELECT returns only what viewer should see
[ ] staff  — INSERT succeeds
[ ] viewer — INSERT is rejected
[ ] staff  — UPDATE succeeds only on allowed rows
[ ] only admin — DELETE succeeds; staff/viewer DELETE is rejected
[ ] Ran with RLS enabled (never as postgres/service_role — both bypass RLS)
```

## 5. Wire the client

1. Copy **Project URL** → `.env` → `VITE_SUPABASE_URL`
2. Copy **anon public key** (Settings → API) → `.env` → `VITE_SUPABASE_ANON_KEY`
3. The anon key is public by design; **never** put `service_role` (or any third-party secret) in a `VITE_*` var — those live only in Edge Functions (`supabase secrets set`, Phase 2+).

## 6. Netlify

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Site configuration → Environment variables**, then redeploy. `netlify.toml` at the repo root already defines the SPA redirect.
