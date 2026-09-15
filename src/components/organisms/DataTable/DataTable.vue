<!-- src/components/organisms/DataTable/DataTable.vue -->
<!-- ORGANISM: complete UI section. Receives data via props from the View — it MUST NOT
     import repositories or data composables (docs/AI-GUIDELINES.md anti-patterns). -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import TablePagination from './TablePagination.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import AppEmptyState from '@/components/atoms/AppEmptyState.vue'

const props = defineProps<{
  data: Record<string, unknown>[]
  loading?: boolean
  pagination?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  } | null
  sort?: { sortBy: string; sortDir: 'asc' | 'desc' } | null
  sortOptions?: { label: string; value: string }[]
}>()

const emit = defineEmits<{
  search: [query: string]
  'page-change': [page: number]
  'row-click': [row: Record<string, unknown>]
  'sort-change': [sortBy: string, sortDir: 'asc' | 'desc']
}>()

const searchQuery = ref('')
function onSearch() {
  emit('search', searchQuery.value)
}

const DEFAULT_SORT_OPTIONS = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Oldest', value: 'created_at:asc' },
]

const options = computed(() =>
  props.sortOptions?.length ? props.sortOptions : DEFAULT_SORT_OPTIONS,
)
const currentSortValue = computed(() =>
  props.sort ? `${props.sort.sortBy}:${props.sort.sortDir}` : options.value[0]?.value,
)

function onSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const [sortBy, sortDir] = value.split(':')
  emit('sort-change', sortBy, sortDir === 'asc' ? 'asc' : 'desc')
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search..."
          class="dark:bg-dark-900 h-11 w-full max-w-xs rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          @input="onSearch"
        />

        <div class="flex items-center gap-2">
          <label class="text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">Sort by</label>
          <div class="relative z-20 bg-transparent">
            <select
              :value="currentSortValue"
              class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 sm:w-48"
              @change="onSortChange"
            >
              <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <AppEmptyState
        v-else-if="!data.length"
        message="No data found"
        description="Try adjusting your search or add a new entry."
      />

      <table v-else class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <slot name="header" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="row in data"
            :key="(row.id as string)"
            class="border-t border-gray-100 dark:border-gray-800"
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
