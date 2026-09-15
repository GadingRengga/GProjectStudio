<!-- src/views/customer/CustomerListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/composables/useCustomer'
import { usePagination } from '@/composables/usePagination'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DataTable from '@/components/organisms/DataTable/DataTable.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import SummaryCard from '@/components/organisms/SummaryCard.vue'
import TrendChart from '@/components/organisms/TrendChart.vue'
import type { Customer } from '@/types/customer.types'
import { formatDatetime } from '@/utils/date'

const router = useRouter()
const {
  customers,
  loading,
  pagination,
  stats,
  trend,
  statsLoading,
  fetchCustomers,
  deleteCustomer,
  fetchCustomerStats,
} = useCustomer()
const { params, setPage, setSearch, setSort, sortBy, sortDir } = usePagination({ page: 1, perPage: 15 })
const { can } = usePermission()

function load() {
  void fetchCustomers(params.value)
  void fetchCustomerStats()
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
  { label: 'Name A–Z', value: 'name:asc' },
  { label: 'Name Z–A', value: 'name:desc' },
]

function onSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
  setSort(nextSortBy, nextSortDir)
  load()
}

function goToDetail(id: string) {
  router.push({ name: 'customer-detail', params: { id } })
}

function goToCreate() {
  router.push({ name: 'customer-create' })
}

function typeVariant(type: Customer['type']): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (type === 'bumn') return 'warning'
  if (type === 'company') return 'info'
  if (type === 'university') return 'success'
  return 'default'
}

function typeLabel(type: Customer['type']): string {
  switch (type) {
    case 'company':
      return 'Company'
    case 'personal':
      return 'Personal'
    case 'institute':
      return 'Institute'
    case 'university':
      return 'University'
    case 'bumn':
      return 'BUMN'
    default:
      return type
  }
}

async function handleDelete(id: string) {
  if (!can('delete', 'customers')) return
  const confirmed = window.confirm('Delete this customer? This action cannot be undone.')
  if (!confirmed) return
  const ok = await deleteCustomer(id)
  if (ok) load()
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Customers'" />

    <div class="space-y-5 sm:space-y-6">
      <div class="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <SummaryCard
          title="Customer Summary"
          :items="[
            { label: 'Total Customers', value: statsLoading ? '…' : (stats?.total ?? 0) },
            { label: 'Active', value: statsLoading ? '…' : (stats?.active ?? 0) },
            { label: 'New This Month', value: statsLoading ? '…' : (stats?.newThisMonth ?? 0) },
            { label: 'Companies', value: statsLoading ? '…' : (stats?.companies ?? 0) },
          ]"
        />

        <TrendChart
          title="New Customers"
          subtitle="Customer growth over the last 12 months"
          series-name="Customers"
          :categories="trend.map((p) => p.label)"
          :values="trend.map((p) => p.value)"
        />
      </div>

      <ComponentCard title="Customers">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Manage client data, contacts, and status.
          </p>
          <Button
            v-if="can('create', 'customers')"
            variant="primary"
            size="sm"
            @click="goToCreate"
          >
            + Add Customer
          </Button>
        </div>

        <DataTable
          :data="customers as unknown as Record<string, unknown>[]"
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
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Type</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Contact</p>
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
                {{ (row as unknown as Customer).code }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ (row as unknown as Customer).name }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <AppBadge :variant="typeVariant((row as unknown as Customer).type)">
                {{ typeLabel((row as unknown as Customer).type) }}
              </AppBadge>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ (row as unknown as Customer).email ?? (row as unknown as Customer).phone ?? '-' }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <AppBadge :variant="(row as unknown as Customer).isActive ? 'success' : 'danger'">
                {{ (row as unknown as Customer).isActive ? 'Active' : 'Inactive' }}
              </AppBadge>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ formatDatetime((row as unknown as Customer).updatedAt) }}
              </p>
            </td>
            <td class="px-5 py-4 text-right sm:px-6" @click.stop>
              <Button
                v-if="can('delete', 'customers')"
                variant="outline"
                size="sm"
                class-name="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                @click="handleDelete((row as unknown as Customer).id)"
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
