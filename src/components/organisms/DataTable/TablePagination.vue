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
  <div class="flex items-center justify-between border-t border-gray-100 px-4 py-3">
    <p class="text-xs text-gray-500">
      Page {{ page }} of {{ totalPages }} · {{ total }} items
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page <= 1"
        @click="emit('page-change', page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page >= totalPages"
        @click="emit('page-change', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
