<!-- src/views/service/ServiceListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useService } from '@/composables/useService'
import { usePagination } from '@/composables/usePagination'
import { usePermission } from '@/composables/usePermission'
import { useConfirm } from '@/composables/useConfirm'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DataTable from '@/components/organisms/DataTable/DataTable.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import IconButton from '@/components/atoms/IconButton.vue'
import Alert from '@/components/ui/Alert.vue'
import { PlusIcon } from '@/icons'
import { Trash2 } from 'lucide-vue-next'
import type { Service } from '@/types/service.types'
import { formatDatetime } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'

const router = useRouter()
const { services, loading, error, pagination, fetchServices, deleteService } = useService()
const { confirm } = useConfirm()
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
  const confirmed = await confirm({
    title: 'Delete Service',
    message: 'This service will be removed from the catalogue. This action cannot be undone.',
    confirmText: 'Delete',
    tone: 'danger',
  })
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
            :start-icon="PlusIcon"
            @click="goToCreate"
          >
            Add Service
          </Button>
        </div>

        <Alert
          v-if="error"
          variant="error"
          title="Failed to load services"
          :message="error"
          class="mb-5"
        />

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
              <div class="flex items-center justify-end">
                <IconButton
                  v-if="can('delete', 'services')"
                  :icon="Trash2"
                  tooltip="Delete Service"
                  tone="danger"
                  @click="handleDelete((row as unknown as Service).id)"
                />
                <span v-else class="text-xs text-gray-300">—</span>
              </div>
            </td>
          </template>
        </DataTable>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>