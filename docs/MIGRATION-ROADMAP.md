> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## 🔄 Database Migration Guide

When Supabase free plan hits limits (500MB DB, 2GB bandwidth/month), follow these steps:

### Recommended Alternative Providers

| Provider | Migration Effort | Best For |
|----------|-----------------|----------|
| **Neon** | Low — still PostgreSQL, similar API | Staying on PostgreSQL, larger free tier |
| **PocketBase** | Medium — self-hosted, similar REST API | Cheap VPS, full control |
| **Railway + PostgreSQL** | Medium — need a thin REST layer | Full control, team projects |
| **Directus** | Medium — auto-generates REST from schema | Need built-in admin panel |

### Migration Steps (4 Steps Only)

```
Step 1: Export data
  Supabase Dashboard → Settings → Database → Backups → Download

Step 2: Create new repository implementations
  Create folder: src/repositories/[provider]/
  For each module, create [Provider][Name]Repository.ts
  Implement the EXACT same interface as SupabaseXxxRepository
  (same method names, same parameter types, same return types)

Step 3: Update src/repositories/index.ts
  Change:  import { SupabaseCustomerRepository } from './supabase/...'
  To:      import { PocketbaseCustomerRepository } from './pocketbase/...'

  Change:  export const customerRepository = new SupabaseCustomerRepository()
  To:      export const customerRepository = new PocketbaseCustomerRepository()

Step 4: Update .env
  Remove: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  Add: whatever the new provider needs (API_URL, API_KEY, etc.)

Result: Zero changes in Views, Composables, Stores, or Components.
```

---

## 📅 Development Phases

### Phase 0 — Foundation (Week 1)
- [ ] `npm create vue@latest erp-app` with TypeScript enabled
- [ ] Install and configure TailAdmin + Tailwind CSS
- [ ] Create Supabase project, run all SQL schemas above in order
- [ ] Set up full folder structure as documented
- [ ] Implement `DashboardLayout` and `AuthLayout`
- [ ] Implement `useAuth` + `LoginView` + route guards
- [ ] Set up Netlify with `netlify.toml`
- [ ] Build base atoms: `AppBadge`, `AppSpinner`, `AppEmptyState`, `AppAvatar`
- [ ] Build `DataTable` organism
- [ ] Build `FormField` molecule

### Phase 1 — Core Modules (Week 2–6)
Each module follows this exact order:
1. Types (`src/types/[module].types.ts`)
2. Repository Interface (`repositories/interfaces/I[Module]Repository.ts`)
3. Supabase Implementation (`repositories/supabase/Supabase[Module]Repository.ts`)
4. Register in `repositories/index.ts`
5. Composable (`composables/use[Module].ts`)
6. Views: List → Detail → Form

- [ ] Customer module
- [ ] Service module
- [ ] Order + Custom Order module
- [ ] Project + Milestones module
- [ ] Invoice + PDF export
- [ ] Finance + basic reporting

### Phase 2 — Dashboard & Polish (Week 7–8)
- [ ] Dashboard with `StatCard` organisms and charts
- [ ] Role management UI (admin only)
- [ ] Overdue invoice notifications
- [ ] Excel export per module
- [ ] Audit log viewer (admin only)

### Phase 3 — Expansion (Per Roadmap)
- [ ] Inventory module
- [ ] HR / Payroll module
- [ ] Multi-company support
- [ ] Advanced financial reports
- [ ] External API integrations


---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
