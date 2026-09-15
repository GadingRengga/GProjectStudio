<!-- src/views/users/UserListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { usePagination } from '@/composables/usePagination'
import { usePermission } from '@/composables/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirm } from '@/composables/useConfirm'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DataTable from '@/components/organisms/DataTable/DataTable.vue'
import SummaryCard from '@/components/organisms/SummaryCard.vue'
import type { SummaryItem } from '@/components/organisms/SummaryCard.vue'
import TrendChart from '@/components/organisms/TrendChart.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import IconButton from '@/components/atoms/IconButton.vue'
import Alert from '@/components/ui/Alert.vue'
import { PlusIcon } from '@/icons'
import { Eye, ShieldCheck, Trash2, UserCog, Users } from 'lucide-vue-next'
import type { AppUser } from '@/types/user.types'
import { formatDatetime } from '@/utils/date'
import { roleLabel, roleVariant } from '@/utils/role'

const router = useRouter()
const authStore = useAuthStore()
const { users, loading, error, pagination, stats, fetchUsers, fetchStats, revokeAccess } = useUser()
const { confirm } = useConfirm()
const { params, setPage, setSearch, setSort, sortBy, sortDir } = usePagination({
  page: 1,
  perPage: 15,
  sortBy: 'created_at',
  sortDir: 'desc',
})
const { can } = usePermission()

function load() {
  void fetchUsers(params.value)
}

onMounted(() => {
  load()
  void fetchStats()
})

function onSearch(query: string) {
  setSearch(query)
  load()
}

function onPageChange(page: number) {
  setPage(page)
  load()
}

// Only the columns whitelisted inside list_app_users() are offered here. Any other
// value silently falls back to created_at DESC server-side, which would look like a
// broken sort to the admin, so the list stays in sync with the SQL function.
const sortOptions = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Oldest', value: 'created_at:asc' },
  { label: 'Email A–Z', value: 'email:asc' },
  { label: 'Email Z–A', value: 'email:desc' },
  { label: 'Role A–Z', value: 'role:asc' },
  { label: 'Role Z–A', value: 'role:desc' },
]

function onSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
  setSort(nextSortBy, nextSortDir)
  load()
}

function goToDetail(id: string) {
  router.push({ name: 'user-detail', params: { id } })
}

function goToCreate() {
  router.push({ name: 'user-create' })
}

async function handleRevoke(userId: string) {
  if (!can('delete', 'users')) return
  const confirmed = await confirm({
    title: 'Revoke Access',
    message:
      'This user keeps their login, but cannot read or write any data until a role is assigned again.',
    confirmText: 'Revoke',
    tone: 'danger',
  })
  if (!confirmed) return
  const ok = await revokeAccess(userId)
  if (ok) {
    load()
    void fetchStats()
  }
}

function formatLastSignIn(value: string | null): string {
  return value ? formatDatetime(value) : 'Never'
}

// Revoking your own access is a footgun: it is allowed only while another admin
// exists, and it is easy to click by accident. The database permits it, so the
// UI declines to offer it rather than relying on a confirm() dialog.
const isSelf = (userId: string) => authStore.user?.id === userId

const summaryItems = computed<SummaryItem[]>(() => [
  { label: 'Total Users', value: stats.value?.total ?? 0, icon: Users, tone: 'brand' },
  { label: 'Admins', value: stats.value?.admins ?? 0, icon: ShieldCheck, tone: 'error' },
  { label: 'Staff', value: stats.value?.staff ?? 0, icon: UserCog, tone: 'warning' },
  { label: 'Viewers', value: stats.value?.viewers ?? 0, icon: Eye, tone: 'success' },
])

const chartCategories = ['Admin', 'Staff', 'Viewer', 'No access']
const chartValues = computed(() => [
  stats.value?.admins ?? 0,
  stats.value?.staff ?? 0,
  stats.value?.viewers ?? 0,
  stats.value?.noAccess ?? 0,
])
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Users & Roles'" />

    <div class="space-y-5 sm:space-y-6">
      <!-- Summary + distribution -->
      <div class="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <SummaryCard
          title="Access Summary"
          subtitle="Accounts registered in this workspace."
          :items="summaryItems"
        />
        <TrendChart
          title="Users by Role"
          series-name="Users"
          :categories="chartCategories"
          :values="chartValues"
        />
      </div>

      <!-- Directory -->
      <ComponentCard
        title="User Accounts"
        desc="Assign a role to grant access. A user with no role can sign in but cannot read or write any data."
      >
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Changing a role is recorded in the audit log automatically.
          </p>
          <Button v-if="can('create', 'users')" variant="primary" size="sm" :start-icon="PlusIcon" @click="goToCreate">
            Add User
          </Button>
        </div>

        <Alert
          v-if="error"
          variant="error"
          title="Failed to load users"
          :message="error"
          class="mb-5"
        />

        <DataTable
          :data="users as unknown as Record<string, unknown>[]"
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
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Email</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Role</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                Last Sign-in
              </p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Joined</p>
            </th>
            <th class="px-5 py-3 text-right sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                <span class="sr-only">Actions</span>
              </p>
            </th>
          </template>
          <template #row="{ row }">
            <td class="px-5 py-4 sm:px-6">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {{ (row as unknown as AppUser).email ?? '-' }}
                </p>
                <AppBadge v-if="isSelf((row as unknown as AppUser).id)" variant="info">You</AppBadge>
              </div>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <AppBadge :variant="roleVariant((row as unknown as AppUser).role)">
                {{ roleLabel((row as unknown as AppUser).role) }}
              </AppBadge>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ formatLastSignIn((row as unknown as AppUser).lastSignInAt) }}
              </p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ formatDatetime((row as unknown as AppUser).createdAt) }}
              </p>
            </td>
            <td class="px-5 py-4 text-right sm:px-6" @click.stop>
              <div class="flex items-center justify-end">
                <IconButton
                  v-if="can('delete', 'users') && !isSelf((row as unknown as AppUser).id)"
                  :icon="Trash2"
                  tooltip="Revoke Access"
                  tone="danger"
                  @click="handleRevoke((row as unknown as AppUser).id)"
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