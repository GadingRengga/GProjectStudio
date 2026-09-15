<!-- src/views/service/ServiceListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useService } from '@/composables/useService'
import { usePagination } from '@/composables/usePagination'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DataTable from '@/components/organisms/DataTable/DataTable.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import type { Service } from '@/types/service.types'
import { formatDatetime } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'

const router = useRouter()
const { services, loading, pagination, fetchServices, deleteService } = useService()
const { params, setPage, setSearch, setSort, sortBy, sortDir } = usePagination({ page: 1, perPage: 15 })
const { can } = usePermission()

function load() {
  void fetchServices(params.value)
}

onMounted(load)

function onSearch(query: string) {
  setSearch(query)
  load()
}

function onPageChange(page: number) {
  setPage(page)
  load()
}

const sortOptions = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Oldest', value: 'created_at:asc' },
  { label: 'Price high → low', value: 'base_price:desc' },
  { label: 'Price low → high', value: 'base_price:asc' },
  { label: 'Name A–Z', value: 'name:asc' },
  { label: 'Name Z–A', value: 'name:desc' },
]

function onSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
  setSort(nextSortBy, nextSortDir)
  load()
}

function goToDetail(id: string) {
  router.push({ name: 'service-detail', params: { id } })
}

function goToCreate() {
  router.push({ name: 'service-create' })
}

async function handleDelete(id: string) {
  if (!can('delete', 'services')) return
  const confirmed = window.confirm('Delete this service? This action cannot be undone.')
  if (!confirmed) return
  const ok = await deleteService(id)
  if (ok) load()
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Services'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Services">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Catalogue of billable services and their base rates.
          </p>
          <Button
            v-if="can('create', 'services')"
            variant="primary"
            size="sm"
            @click="goToCreate"
          >
            + Add Service
          </Button>
        </div>

        <DataTable
          :data="services as unknown as Record<string, unknown>[]"
          :loading="loading"
          :pagination="pagination"
          :sort="{ sortBy, sortDir }"
          :sort-options="sortOptions"
          @search="onSearch"
          @page-change="onPageChange"
          @sort-change="onSortChange"
          @row-click="(row) => goToDetail(row.id as string)"
        >
          <template #header>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Code</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Name</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Category</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Unit</p>
            </th>
            <th class="px-5 py-3 text-right sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Base Price</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Updated</p>
            </th>
            <th class="px-5 py-3 text-right sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                <span class="sr-only">Actions</span>
              </p>
            </th>
          </template>
          <template #row="{ row }">
            <td class="px-5 py-4 sm:px-6">
              <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {{ (row as unknown as Service).code }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ (row as unknown as Service).name }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <AppBadge v-if="(row as unknown as Service).category" variant="info">
                {{ (row as unknown as Service).category }}
              </AppBadge>
              <span v-else class="text-gray-300 dark:text-gray-400">—</span>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ (row as unknown as Service).unit ?? '-' }}
              </p>
            </td>
            <td class="px-5 py-4 text-right tabular-nums sm:px-6">
              <p class="text-gray-800 text-theme-sm dark:text-white/90">
                {{ formatRupiah((row as unknown as Service).basePrice) }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <AppBadge :variant="(row as unknown as Service).isActive ? 'success' : 'danger'">
                {{ (row as unknown as Service).isActive ? 'Active' : 'Inactive' }}
              </AppBadge>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ formatDatetime((row as unknown as Service).updatedAt) }}
              </p>
            </td>
            <td class="px-5 py-4 text-right sm:px-6" @click.stop>
              <Button
                v-if="can('delete', 'services')"
                variant="outline"
                size="sm"
                class-name="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                @click="handleDelete((row as unknown as Service).id)"
              >
                Delete
              </Button>
              <span v-else class="text-xs text-gray-300">—</span>
            </td>
          </template>
        </DataTable>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>