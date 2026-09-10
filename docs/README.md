# ERP Web Application — Documentation Index

> **To AI Assistants (Cline, Cursor, Copilot, etc.):**
> This documentation set is the **single source of truth** for this project, split into focused files so each session only needs to load what's relevant.
> Read this index first, then open only the file(s) relevant to your current task.
> Every architectural decision here has been deliberately chosen — do not change patterns without a strong reason.
> When something is ambiguous, ask the developer before making assumptions.
> When adding a new module or feature, follow the exact same patterns shown in the examples in the relevant file.

---

## 📚 File Index — Read Only What You Need

| File | Read this when you're working on... |
|------|----------------------------------------|
| `README.md` (this file) | Always — project context, tech stack, modules |
| `ARCHITECTURE.md` | Understanding the overall architecture, security layers, or folder structure |
| `DATA-LAYER.md` | Building/editing a repository, composable, or auth logic |
| `COMPONENTS.md` | Building/editing a Vue component (atom/molecule/organism), naming a file |
| `DATABASE.md` | Writing SQL, adding a table, or touching the audit log |
| `SECURITY-RLS.md` | Writing/reviewing/testing an RLS policy |
| `EDGE-FUNCTIONS-OPS.md` | Building an Edge Function, or touching backups / role changes |
| `CONFIG.md` | Editing `.env`, `netlify.toml`, `vite.config.ts`, or `lib/supabase.ts` |
| `AI-GUIDELINES.md` | Before writing any code — the checklist and anti-patterns |
| `MIGRATION-ROADMAP.md` | Planning a database migration, or checking project phase status |

---

## 🧠 Project Context

This is a **web-based ERP (Enterprise Resource Planning)** application.

- **No traditional backend server.** All data and auth are handled by **Supabase** (Phase 1).
- The architecture is designed so the **database can be swapped** (migrate from Supabase to another provider) **without changing any Vue code** — only `repositories/supabase/` folder and `repositories/index.ts` change.
- The app is deployed as a **static site** to **Netlify**.
- Security is enforced at the **database layer** (RLS, constraints, triggers) — not just the frontend.

### Tech Stack

| Technology | Role | Version |
|------------|------|---------|
| Vue 3 | UI framework — Composition API only | ^3.5 |
| Vite | Build tool | ^6 |
| TypeScript | Primary language — required in all files | ^5.7 |
| TailAdmin | Base UI kit (pre-built components) | latest (v2.3.0 template) |
| Tailwind CSS | Utility-first CSS | ^4 |
| Pinia | Global state management | ^4 |
| Vue Router 4 | SPA routing | ^4 |
| Supabase JS | Database + Auth client (Phase 1) | ^2 |
| Supabase Edge Functions | Secret handling, 3rd-party API calls, rate-limited actions (Phase 2+) | latest |
| @vueuse/core | Composable utilities | latest |

---

## 📦 Application Modules

Six core modules in Phase 1. New modules can be added without changing the core architecture.

| Module | Description | Primary Tables |
|--------|-------------|----------------|
| **Customer** | Client data, contacts, transaction history | `customers` |
| **Service** | Service catalog and pricing | `services` |
| **Order** | Standard and custom orders per customer | `orders`, `order_items` |
| **Project** | Project management from orders, milestones | `projects`, `project_milestones` |
| **Invoice** | Invoice creation and management | `invoices`, `invoice_items` |
| **Finance** | Income and expense transactions | `transactions` |

---

