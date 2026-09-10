<!-- src/components/organisms/DataTable/DataTable.vue -->
<!-- ORGANISM: complete UI section. Receives data via props from the View — it MUST NOT
     import repositories or data composables (docs/AI-GUIDELINES.md anti-patterns). -->
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
function onSearch() {
  emit('search', searchQuery.value)
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div class="border-b border-gray-100 p-4">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search..."
        class="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
        @input="onSearch"
      />
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="!data.length"
      message="No data found"
      description="Try adjusting your search or add a new entry."
    />

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs tracking-wider text-gray-500 uppercase">
          <slot name="header" />
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="row in data"
            :key="(row.id as string)"
            class="cursor-pointer transition-colors hover:bg-gray-50"
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
