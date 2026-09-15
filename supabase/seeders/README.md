# Supabase Seeders — data awal / demo (DML only)

> **Aturan keras:** folder ini hanya berisi **DML** (`INSERT` / `UPSERT` / blok `DO`).
> Dilarang `CREATE TABLE`, `ALTER`, `DROP`, `CREATE POLICY`, `CREATE FUNCTION`, `CREATE TRIGGER`.
> Semua itu milik `../migrations/` (DDL only, mulai `0007` ke depan).

## Urutan run (setelah semua migrations selesai)

| Order | File | Isi |
|---|---|---|
| 1 | `001_company_profile.sql` | Upsert singleton `company_profile` (`My Company`) |
| 2 | `002_app_menus.sql` | Upsert menu sidebar default (`app_menus`) |
| 3 | `003_user_roles_default.sql` | Upsert role default via lookup email `auth.users` |

Jalankan via **Supabase SQL Editor** satu per satu, atau via CLI:

```bash
supabase db execute -f supabase/seeders/001_company_profile.sql
supabase db execute -f supabase/seeders/002_app_menus.sql
supabase db execute -f supabase/seeders/003_user_roles_default.sql
```

## Konvensi

1. **Idempotent wajib** — setiap file aman di-run ulang berkali-kali:
   - `INSERT ... ON CONFLICT (...) DO UPDATE` / `DO NOTHING`, atau
   - blok `DO $$ ... $$` dengan guard `IF NOT EXISTS`.
2. **Penomoran `NNN_nama.sql`** — tiga digit, naik berurutan. Jangan gunakan ulang nomor lama.
3. **Jangan edit migrations yang sudah ter-apply** untuk memindah data ke sini (immutable history). Contoh: `0005_organization.sql` masih berisi `INSERT INTO company_profile` — itu dibiarkan apa adanya, dan `001_company_profile.sql` memakai `ON CONFLICT DO NOTHING` sehingga aman walau `0005` sudah insert duluan. Aturan "tanpa INSERT di migrations" berlaku mulai `0007`.
4. **Tidak ada password / secret di sini.** `003` hanya memetakan `email → role`; user-nya sendiri dibuat manual via Dashboard `Authentication → Users` (atau Auth API) sebelum seeder di-run.
5. **Seeder memicu audit trigger** (`fn_audit_log`) — itu transparan dan memang diinginkan (perubahan awal tetap tercatat).
6. Sebelum seed menu untuk modul baru (orders/projects/invoices/finance), pastikan **rute list-index-nya sudah ada** — jangan seed dead-link (aturan sidebar di `docs/COMPONENTS.md`).
