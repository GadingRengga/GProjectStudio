<!-- src/views/customer/CustomerListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/composables/useCustomer'
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
import SummaryCard from '@/components/organisms/SummaryCard.vue'
import TrendChart from '@/components/organisms/TrendChart.vue'
import { PlusIcon } from '@/icons'
import { Building2, Trash2, UserCheck, UserPlus, Users } from 'lucide-vue-next'
import type { Customer } from '@/types/customer.types'
import { formatDatetime } from '@/utils/date'

const router = useRouter()
const {
  customers,
  loading,
  error,
  pagination,
  stats,
  trend,
  statsLoading,
  fetchCustomers,
  deleteCustomer,
  fetchCustomerStats,
} = useCustomer()
const { confirm } = useConfirm()
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
  const confirmed = await confirm({
    title: 'Delete Customer',
    message: 'This customer will be permanently removed, along with the data attached to it. This action cannot be undone.',
    confirmText: 'Delete',
    tone: 'danger',
  })
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
            { label: 'Total Customers', value: statsLoading ? '…' : (stats?.total ?? 0), icon: Users, tone: 'brand' },
            { label: 'Active', value: statsLoading ? '…' : (stats?.active ?? 0), icon: UserCheck, tone: 'success' },
            { label: 'New This Month', value: statsLoading ? '…' : (stats?.newThisMonth ?? 0), icon: UserPlus, tone: 'warning' },
            { label: 'Companies', value: statsLoading ? '…' : (stats?.companies ?? 0), icon: Building2, tone: 'neutral' },
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
            :start-icon="PlusIcon"
            @click="goToCreate"
          >
            Add Customer
          </Button>
        </div>

        <Alert
          v-if="error"
          variant="error"
          title="Failed to load customers"
          :message="error"
          class="mb-5"
        />

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
              <div class="flex items-center justify-end">
                <IconButton
                  v-if="can('delete', 'customers')"
                  :icon="Trash2"
                  tooltip="Delete Customer"
                  tone="danger"
                  @click="handleDelete((row as unknown as Customer).id)"
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
