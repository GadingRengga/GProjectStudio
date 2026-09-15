// src/composables/usePagination.ts
// Shared pagination state for List views.
// Local state only (docs/AI-GUIDELINES.md #3) — one instance per view.
import { computed, ref } from 'vue'
import type { PaginationParams } from '@/types/common.types'

export function usePagination(initial: Partial<PaginationParams> = {}) {
  const page = ref(initial.page ?? 1)
  const perPage = ref(initial.perPage ?? 15)
  const search = ref(initial.search ?? '')
  const sortBy = ref(initial.sortBy ?? 'created_at')
  const sortDir = ref<'asc' | 'desc'>(initial.sortDir ?? 'desc')

  const params = computed<PaginationParams>(() => ({
    page: page.value,
    perPage: perPage.value,
    search: search.value || undefined,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
  }))

  function setPage(next: number) {
    page.value = Math.max(1, next)
  }

  function setSearch(query: string) {
    search.value = query
    page.value = 1
  }

  function setSort(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
    sortBy.value = nextSortBy
    sortDir.value = nextSortDir
    page.value = 1
  }

  function reset() {
    page.value = initial.page ?? 1
    perPage.value = initial.perPage ?? 15
    search.value = initial.search ?? ''
    sortBy.value = initial.sortBy ?? 'created_at'
    sortDir.value = initial.sortDir ?? 'desc'
  }

  return { page, perPage, search, sortBy, sortDir, params, setPage, setSearch, setSort, reset }
}
