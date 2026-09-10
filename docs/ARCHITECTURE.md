> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## 🏛️ Core Architecture

### The Most Important Rule

> ❌ **STRICTLY FORBIDDEN:** Importing the `supabase` client anywhere outside `src/repositories/supabase/` and `src/lib/supabase.ts`.

This is rule number one. If you need to access database data, always follow this flow:

```
View (.vue)
  → calls composable (useCustomer, useOrder, etc.)
    → composable calls Repository via Interface
      → Interface is implemented by SupabaseXxxRepository
        → SupabaseXxxRepository is the ONLY place allowed to use supabase client
```

**Why?** When Supabase free plan runs out and we migrate to another database, we only need to:
1. Create a new repository implementation (e.g. `RestCustomerRepository.ts`)
2. Change 1 line per module in `repositories/index.ts`
3. Done. Zero changes in Views, Composables, Stores, or Components.

### Security Architecture (No Backend)

Since there is no backend server, security is enforced in three layers:

```
Layer 1 — Frontend (Vue)
  Role-based UI rendering, form validation, route guards
  ⚠️ This layer CAN be bypassed by a determined user via DevTools or direct API calls
  → Never rely on this layer alone for critical security

Layer 2 — Database RLS (Supabase Row Level Security)
  Every table has policies that check auth.uid() and user role
  ✅ This layer CANNOT be bypassed — enforced by PostgreSQL itself
  → This is the real security gate

Layer 3 — Database Constraints & Triggers
  CHECK constraints, NOT NULL, audit logs via triggers
  ✅ This layer CANNOT be bypassed — enforced by PostgreSQL itself
  → Data integrity guarantee even if Layer 1 and 2 have gaps
```

### ⚠️ Security Limitations — What RLS Does NOT Cover

> RLS is the real security gate, but it is **row-level only**. Since there is no backend to catch a mistake, a single wrong policy is a full data leak. Keep the following in mind for every module built on top of this architecture.

1. **RLS is row-level, not column-level.** A policy controls which *rows* a role can see, not which *columns*. If a role can read a `customers` row, it can read every column in that row unless you explicitly restrict columns via a view or a scoped `select()` in the repository. Flag any column carrying sensitive data (e.g. future HR/payroll fields) and design a dedicated view or column-level policy for it — do not assume table-level RLS is enough.

2. **Cross-table business rules need real functions, not just CHECK constraints.** Rules like "an order's `total_amount` must equal the sum of its `order_items`" or "an order cannot be deleted once a paid invoice references it" cannot be expressed as a simple `CHECK`. Implement these as `plpgsql` trigger functions (see the audit trigger pattern below) or `SECURITY DEFINER` functions called from repositories, and write a test for each rule — this logic is easy to skip when a new module is added quickly.

3. **No backend means no application-level rate limiting.** Supabase Auth includes baseline brute-force protection on login, but there is nothing to throttle abusive patterns like large data exports or rapid record creation from an authenticated session. If a module needs this (e.g. Finance exports), it must go through an Edge Function that can enforce limits, rather than direct client → Postgres calls.

4. **Anything needing a secret or a third-party API must go through Supabase Edge Functions.** Sending email, calling a payment gateway, or any operation that requires a private API key cannot be done safely from the client — the anon key is public by design. Add an `edge-functions/` folder (see updated folder structure below) for this from Phase 2 onward; do not put third-party secrets in `.env` variables prefixed `VITE_`, since those are bundled into the public client build.

5. **RLS policies must be tested per role, not just written once.** Because there is no backend to catch a bad policy, a typo (missing `WHERE`, a leftover `USING (true)` from development) is a silent full-table leak. Before shipping any new table: write a policy, then verify with a real (or Supabase's SQL editor "run as role") query for each of `admin`, `staff`, and `viewer` that the expected rows — and only those rows — are returned.

6. **Audit triggers log *what* changed, not *who is allowed to* change it.** The `fn_audit_log()` trigger below is a record-keeping tool, not an access-control tool. Access control is still entirely the job of the `INSERT`/`UPDATE`/`DELETE` RLS policies for that table — never treat "it's logged" as a substitute for "it's restricted."

**Bottom line:** for an internal ERP with a limited number of trusted users, this architecture is solid *if* every RLS policy is deliberately written and tested per role. Treat RLS as "as secure as the policies you actually wrote," not as an automatic guarantee.

---

## 📁 Full Folder Structure

```
supabase/
│
└── functions/                    ← Edge Functions. The ONLY place allowed to hold
    └── [function-name]/             third-party secrets or call external APIs (email,
        └── index.ts                 payment gateway, rate-limited exports, etc.)

src/
│
├── lib/
│   └── supabase.ts               ← Supabase client. ONLY imported in repositories/supabase/*
│
├── types/                        ← All TypeScript interfaces and types
│   ├── common.types.ts           ← PaginatedResult<T>, ApiResponse<T>, PaginationParams
│   ├── customer.types.ts
│   ├── service.types.ts
│   ├── order.types.ts
│   ├── project.types.ts
│   ├── invoice.types.ts
│   └── finance.types.ts
│
├── repositories/
│   ├── interfaces/               ← TypeScript contracts. NEVER change during migration.
│   │   ├── ICustomerRepository.ts
│   │   ├── IServiceRepository.ts
│   │   ├── IOrderRepository.ts
│   │   ├── IProjectRepository.ts
│   │   ├── IInvoiceRepository.ts
│   │   └── IFinanceRepository.ts
│   │
│   ├── supabase/                 ← Supabase implementation. REPLACE THIS FOLDER on migration.
│   │   ├── SupabaseCustomerRepository.ts
│   │   ├── SupabaseServiceRepository.ts
│   │   ├── SupabaseOrderRepository.ts
│   │   ├── SupabaseProjectRepository.ts
│   │   ├── SupabaseInvoiceRepository.ts
│   │   └── SupabaseFinanceRepository.ts
│   │
│   └── index.ts                  ← MIGRATION POINT. Change imports here = migration done.
│
├── composables/                  ← Business logic and data access bridge for Vue
│   ├── useAuth.ts                ← Auth abstraction. Vue has no knowledge of Supabase here.
│   ├── useCustomer.ts
│   ├── useService.ts
│   ├── useOrder.ts
│   ├── useProject.ts
│   ├── useInvoice.ts
│   ├── useFinance.ts
│   ├── useToast.ts
│   ├── usePagination.ts
│   └── usePermission.ts          ← Role-based access control for UI rendering
│
├── stores/                       ← Pinia stores — GLOBAL state only
│   ├── auth.store.ts             ← User session, role, permissions
│   ├── app.store.ts              ← Sidebar open/close, global loading, theme
│   └── notification.store.ts    ← Notification/toast queue
│
├── router/
│   ├── index.ts
│   ├── guards.ts                 ← Auth guard, role guard
│   └── routes/
│       ├── auth.routes.ts
│       ├── customer.routes.ts
│       ├── service.routes.ts
│       ├── order.routes.ts
│       ├── project.routes.ts
│       ├── invoice.routes.ts
│       └── finance.routes.ts
│
├── layouts/                      ← Template level (Atomic Design)
│   ├── DashboardLayout.vue       ← Sidebar + header + <router-view>
│   ├── AuthLayout.vue            ← Login page, centered layout
│   └── PrintLayout.vue           ← Invoice print layout, no sidebar
│
├── views/                        ← Page level (Atomic Design)
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── ForgotPasswordView.vue
│   ├── dashboard/
│   │   └── DashboardView.vue
│   ├── customer/
│   │   ├── CustomerListView.vue
│   │   ├── CustomerDetailView.vue
│   │   └── CustomerFormView.vue
│   ├── service/
│   │   ├── ServiceListView.vue
│   │   └── ServiceFormView.vue
│   ├── order/
│   │   ├── OrderListView.vue
│   │   ├── OrderDetailView.vue
│   │   └── OrderFormView.vue
│   ├── project/
│   │   ├── ProjectListView.vue
│   │   ├── ProjectDetailView.vue
│   │   └── ProjectFormView.vue
│   ├── invoice/
│   │   ├── InvoiceListView.vue
│   │   ├── InvoiceDetailView.vue
│   │   └── InvoiceFormView.vue
│   └── finance/
│       ├── FinanceDashboardView.vue
│       ├── TransactionListView.vue
│       └── TransactionFormView.vue
│
├── components/                   ← Custom components — Atomic Design (see section below)
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── README.md
│
└── utils/
    ├── currency.ts               ← formatRupiah(), formatUSD()
    ├── date.ts                   ← formatDate(), formatDatetime() (Indonesian locale)
    ├── validators.ts             ← isEmail(), isPhone(), isRequired()
    └── pdf.ts                    ← generateInvoicePdf() using jsPDF or html2pdf
```

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
