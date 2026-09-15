> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

# Components — Atomic Design Rules

## 🧩 Atomic Design Rules

### Decision Tree: TailAdmin vs Custom Component

```
Question: "Does TailAdmin already have this component?"
  → YES → Use TailAdmin component. Do NOT recreate it.
  → NO  → Build it in src/components/ following Atomic Design rules below.
```

## 🎨 Theme Components — MANDATORY LOOKUP TABLE

**Before writing ANY UI, check this table. If a component already exists, USE IT VERBATIM. Do not recreate.**

| Need | Use this (already exists) | Location | Do NOT build |
|---|---|---|---|
| Page shell / layout | `AdminLayout` | `@/components/layout/AdminLayout.vue` | `DashboardLayout` or custom wrapper |
| Breadcrumb | `PageBreadcrumb` | `@/components/common/PageBreadcrumb.vue` | Manual back button + `<h1>` |
| Card / panel | `ComponentCard` | `@/components/common/ComponentCard.vue` | Manual `rounded-2xl border...` div |
| Button | `Button` | `@/components/ui/Button.vue` | Raw `<button class="bg-blue-...">` |
| Badge / status pill | `AppBadge` | `@/components/atoms/AppBadge.vue` | Custom `<span>` with variant classes |
| Loading spinner | `AppSpinner` | `@/components/atoms/AppSpinner.vue` | Custom spinner |
| Summary metric | `MetricCard` | `@/components/molecules/MetricCard.vue` | Custom summary/stat card div |
| Summary stats (2×2) | `SummaryCard` | `@/components/organisms/SummaryCard.vue` | Custom stats grid inside a card |
| Trend bar chart | `TrendChart` | `@/components/organisms/TrendChart.vue` | Custom `VueApexCharts` wiring |

### View page skeleton (canonical)

Every module page (List / Detail / Form) MUST follow this exact skeleton:

```vue
<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Page Title'" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Card Title">
        <!-- content here -->
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
```

**Never** wrap content in `min-h-screen`, `max-w-[630px]`, `max-w-7xl`, or manual `rounded-2xl border` card divs — `ComponentCard` handles the card, and `space-y-5 sm:space-y-6` handles spacing.

### Sidebar menu rules

- **Only list-index routes get sidebar entries** (e.g. `/customers`, `/services`).
- **Create/edit routes must NOT appear in the sidebar** (`/customers/new`, `/customers/:id/edit`, `/services/new`, `/services/:id/edit`).
- The create/edit actions live **inside the feature**: the "Add Customer" button on the list view navigates to the create route; the "Edit" button on the detail view navigates to the edit route.
- When adding a new module, add only its list route to the sidebar — never the create or edit subItems.

### Minimum feature completeness (per module)

A module is considered **DONE only when ALL 11 elements exist**. Check every box before calling a module finished:

| # | Element | Where it lives |
|---|---|---|
| 1 | Main table | `[Module]ListView.vue` + `DataTable` organism |
| 2 | Create form | `[Module]FormView.vue` on `/[module]/new` |
| 3 | Edit form | `[Module]FormView.vue` on `/:id/edit` |
| 4 | Show detail | `[Module]DetailView.vue` |
| 5 | Create button | "+ Add [Module]" button on the list view (`Button` component) |
| 6 | Edit button | "Edit" button on the detail view (`Button` component) |
| 7 | Delete button | "Delete" button on list view rows (`Button` outline variant) |
| 8 | Filter search | search input in the `DataTable` toolbar (built in) |
| 9 | Filter sort by | "Sort by" dropdown in the `DataTable` toolbar |
| 10 | Header summary | `SummaryCard` (2×2 stats) beside the chart in `xl:grid-cols-2` above the main table |
| 11 | Header chart | `TrendChart` bar chart (12-month trend) beside the summary in `xl:grid-cols-2` above the main table |

For element 9, the View must pass `:sort="{ sortBy, sortDir }"` and `:sort-options="sortOptions"` to `DataTable` and wire `@sort-change="onSortChange"` (which calls `setSort()` from `usePagination` then reloads). The data layer must support it: `PaginationParams` carries `sortBy`/`sortDir` and the repository maps them to `.order(sortBy, { ascending: sortDir === 'asc' })`.

Sort option value format: `'column:dir'` (e.g. `'created_at:desc'`, `'name:asc'`, `'base_price:desc'`). The column must be a real DB column (snake_case).

### ComponentCard API

```vue
<!-- With title only -->
<ComponentCard title="Customers">
  ...content...
</ComponentCard>

<!-- With title + description -->
<ComponentCard title="Customers" desc="Manage client data and contacts.">
  ...content...
</ComponentCard>
```

Internally it renders: header (`px-6 py-5` with `text-base font-medium text-gray-800 dark:text-white/90` title + optional `desc`), then body (`p-4 border-t border-gray-100 sm:p-6` with `space-y-5`).

### Button API

```vue
<!-- Primary action (brand color) -->
<Button variant="primary" size="sm" @click="save">Save</Button>

<!-- Secondary / outline action -->
<Button variant="outline" size="sm" @click="cancel">Cancel</Button>
```

Variants: `primary` (brand-500 solid), `Outline` (gray ring). Sizes: `sm`, `md`. Props: `startIcon`, `endIcon`, `className`, `disabled`.

### Canonical form input class

For every `<input>`, `<select>`, `<textarea>` inside a form, use this exact class (from `DefaultInputs.vue`):

```
dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800
```

Textareas use the same class minus `h-11`. Disabled inputs add `disabled:bg-gray-100 dark:disabled:bg-gray-800`.

### Canonical select (with chevron)

```vue
<div class="relative z-20 bg-transparent">
  <select
    v-model="form.type"
    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs ... dark:focus:border-brand-800"
  >
    <option value="a">A</option>
  </select>
  <span class="absolute top-1/2 right-4 z-30 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
    <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
</div>
```

### Table cell tokens (from BasicTableOne)

| Element | Class |
|---|---|
| Header cell | `px-5 py-3 text-left sm:px-6` + `<p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">` |
| Body cell | `px-5 py-4 sm:px-6` + `<p class="text-gray-800 text-theme-sm dark:text-white/90">` (primary) or `<p class="text-gray-500 text-theme-sm dark:text-gray-400">` (muted) |
| Header row | `border-b border-gray-200 dark:border-gray-700` |
| Body rows | `divide-y divide-gray-100 dark:divide-gray-700`, each row `border-t border-gray-100 dark:border-gray-800` |

### Dark-mode token reference

| Context | Light | Dark |
|---|---|---|
| Heading | `text-gray-800` | `dark:text-white/90` |
| Body / value | `text-gray-800` / `text-theme-sm` | `dark:text-white/90` |
| Muted / label | `text-gray-500` / `text-theme-xs` | `dark:text-gray-400` |
| Card surface | `bg-white` | `dark:bg-white/[0.03]` |
| Border | `border-gray-200` / `border-gray-100` | `dark:border-gray-800` / `dark:border-gray-700` |
| Input bg | `bg-transparent` | `dark:bg-dark-900` / `dark:bg-gray-900` |
| Focus ring | `focus:border-brand-300 focus:ring-brand-500/10` | `dark:focus:border-brand-800` |

### Level Rules

#### ATOM — Smallest indivisible UI unit
- **Rule:** No internal state. Props-in, events-out only. Single visual responsibility.
- **File naming:** `App[Name].vue` → `AppBadge.vue`, `AppSpinner.vue`, `AppAvatar.vue`
- **FORBIDDEN:** Importing composables, importing repositories, any business logic.

```vue
<!-- src/components/atoms/AppBadge.vue -->
<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}>()
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="{
      'bg-gray-100 text-gray-700':    !variant || variant === 'default',
      'bg-green-100 text-green-700':  variant === 'success',
      'bg-yellow-100 text-yellow-700': variant === 'warning',
      'bg-red-100 text-red-700':      variant === 'danger',
      'bg-blue-100 text-blue-700':    variant === 'info',
    }"
  >
    <slot />
  </span>
</template>
```

#### MOLECULE — 2–5 atoms forming one complete UI function
- **Rule:** May have lightweight local state (open/close, input value). No data composables.
- **File naming:** `[MainFunction].vue` → `FormField.vue`, `SearchableSelect.vue`
- **FORBIDDEN:** Importing data composables (useCustomer, etc.), calling repositories.

```vue
<!-- src/components/molecules/FormField.vue -->
<script setup lang="ts">
defineProps<{
  label: string
  error?: string
  required?: boolean
  hint?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="hint && !error" class="text-xs text-gray-400">{{ hint }}</p>
    <p v-if="error" role="alert" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
```

#### ORGANISM — Complete, self-contained UI section
- **Rule:** May import composables for UI state. CANNOT import repositories directly.
- **File naming:** `[Feature].vue` → `DataTable.vue`, `InvoicePreview.vue`, `KanbanBoard.vue`
- Organisms are the largest reusable units. They tell a story (DataTable shows data, filters, and pagination together).

```vue
<!-- src/components/organisms/DataTable/DataTable.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import TablePagination from './TablePagination.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import AppEmptyState from '@/components/atoms/AppEmptyState.vue'

defineProps<{
  data: Record<string, unknown>[]
  loading?: boolean
  pagination?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  } | null
}>()

const emit = defineEmits<{
  search: [query: string]
  'page-change': [page: number]
  'row-click': [row: Record<string, unknown>]
}>()

const searchQuery = ref('')
function onSearch() { emit('search', searchQuery.value) }
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="p-4 border-b border-gray-100">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search..."
        class="w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="onSearch"
      />
    </div>

    <div v-if="loading" class="flex justify-center items-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="!data.length"
      message="No data found"
      description="Try adjusting your search or add a new entry."
    />

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <slot name="header" />
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="row in data"
            :key="(row.id as string)"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            @click="emit('row-click', row)"
          >
            <slot name="row" :row="row" />
          </tr>
        </tbody>
      </table>
    </div>

    <TablePagination
      v-if="pagination && pagination.totalPages > 1"
      v-bind="pagination"
      @page-change="emit('page-change', $event)"
    />
  </div>
</template>
```

#### TEMPLATE (Layout) — Page skeleton
- **Rule:** Only arrange slot areas. Zero business logic. Zero data fetching.

#### PAGE (View) — Full page
- **Rule:** Calls composables, fills layout slots, delegates rendering to organisms.
- Business logic lives in composables, NOT in `<script setup>` of the View.

### File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Atom | `App[Name].vue` | `AppBadge.vue` |
| Molecule | `[Function].vue` | `FormField.vue` |
| Organism | `[Feature].vue` | `DataTable.vue` |
| Layout | `[Name]Layout.vue` | `DashboardLayout.vue` |
| View | `[Name]View.vue` | `CustomerListView.vue` |
| Composable | `use[Name].ts` | `useCustomer.ts` |
| Store | `[name].store.ts` | `auth.store.ts` |
| Repository Interface | `I[Name]Repository.ts` | `ICustomerRepository.ts` |
| Supabase Repo | `Supabase[Name]Repository.ts` | `SupabaseCustomerRepository.ts` |

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
