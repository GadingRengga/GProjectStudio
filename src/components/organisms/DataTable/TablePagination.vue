<!-- src/components/organisms/DataTable/TablePagination.vue -->
<!-- Child of the DataTable organism: pagination footer, props-in/events-out only. -->
<script setup lang="ts">
defineProps<{
  total: number
  page: number
  perPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:px-6">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Page {{ page }} of {{ totalPages }} · {{ total }} items
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        :disabled="page <= 1"
        @click="emit('page-change', page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        :disabled="page >= totalPages"
        @click="emit('page-change', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
