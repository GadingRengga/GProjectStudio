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
