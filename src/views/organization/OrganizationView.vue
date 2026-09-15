<!-- src/views/organization/OrganizationView.vue -->
<!-- PAGE: company profile overview + org-unit hierarchy tree. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganization } from '@/composables/useOrganization'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import SummaryCard from '@/components/organisms/SummaryCard.vue'
import TrendChart from '@/components/organisms/TrendChart.vue'
import OrgTree from '@/components/organisms/OrgTree.vue'
import type { OrgTreeNode, OrganizationUnitType } from '@/types/organization.types'

const router = useRouter()
const { profile, tree, loading, stats, fetchProfile, fetchTree, fetchStats, toggleUnitActive, deleteUnit } =
  useOrganization()
const { can } = usePermission()

const canWrite = computed(() => can('create', 'organization') || can('update', 'organization'))
// Mirrors the DB gate: company_profile UPDATE is admin-only per RLS.
const canUpdateProfile = computed(() => can('update', 'company_profile'))
const canDelete = computed(() => can('delete', 'organization'))

function load() {
  void fetchProfile()
  void fetchTree()
  void fetchStats()
}

onMounted(load)

function goToCreate() {
  router.push({ name: 'organization-unit-create' })
}
function goToEditProfile() {
  router.push({ name: 'organization-profile-edit' })
}
function goToDetail(id: string) {
  router.push({ name: 'organization-unit-detail', params: { id } })
}
function goToEdit(id: string) {
  router.push({ name: 'organization-unit-edit', params: { id } })
}
function goToAddChild(parentId: string) {
  router.push({ name: 'organization-unit-create', query: { parentId } })
}

async function handleToggleActive(id: string, isActive: boolean) {
  if (!can('update', 'organization')) return
  const updated = await toggleUnitActive(id, isActive)
  if (updated) {
    void fetchTree()
    void fetchStats()
  }
}

const UNIT_TYPES: { key: OrganizationUnitType; label: string }[] = [
  { key: 'directorate', label: 'Directorate' },
  { key: 'division', label: 'Division' },
  { key: 'department', label: 'Department' },
  { key: 'section', label: 'Section' },
  { key: 'team', label: 'Team' },
  { key: 'unit', label: 'Unit' },
]

function countByType(type: string): number {
  let count = 0
  const walk = (nodes: OrgTreeNode[]): void => {
    for (const n of nodes) {
      if (n.type === type) count += 1
      if (n.children.length) walk(n.children)
    }
  }
  walk(tree.value)
  return count
}

const chartCategories = computed(() => UNIT_TYPES.map((t) => t.label))
const chartValues = computed(() => UNIT_TYPES.map((t) => countByType(t.key)))

const profileAddressLine = computed(() => {
  if (!profile.value) return '-'
  const parts = [
    profile.value.address,
    profile.value.village,
    profile.value.district,
    profile.value.regency,
    profile.value.province,
    profile.value.postalCode,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : '-'
})

async function handleDeleteUnit(id: string) {
  if (!can('delete', 'organization')) return
  const confirmed = window.confirm(
    'Delete this unit? Units that still have child units or positions cannot be deleted — move or remove them first.',
  )
  if (!confirmed) return
  const ok = await deleteUnit(id)
  if (ok) {
    void fetchTree()
    void fetchStats()
  }
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Organization'" />
    <div class="space-y-5 sm:space-y-6">
      <!-- Company identity (singleton) -->
      <ComponentCard title="Company Profile" desc="System identity used across the application.">
        <div v-if="loading && !profile" class="flex justify-center py-10">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="profile" class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <img
              v-if="profile.logoUrl"
              :src="profile.logoUrl"
              :alt="profile.name"
              class="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div
              v-else
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold text-brand-500 dark:bg-brand-500/10"
            >
              {{ profile.name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ profile.name }}</h3>
              <p v-if="profile.tagline" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {{ profile.tagline }}
              </p>
              <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Email</dt>
                  <dd class="mt-0.5 text-gray-800 text-theme-sm dark:text-white/90">{{ profile.email ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Phone</dt>
                  <dd class="mt-0.5 text-gray-800 text-theme-sm dark:text-white/90">{{ profile.phone ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Website</dt>
                  <dd class="mt-0.5 text-gray-800 text-theme-sm dark:text-white/90">{{ profile.website ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">NPWP</dt>
                  <dd class="mt-0.5 text-gray-800 text-theme-sm dark:text-white/90">{{ profile.npwp ?? '-' }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Address</dt>
                  <dd class="mt-0.5 text-gray-800 text-theme-sm dark:text-white/90">{{ profileAddressLine }}</dd>
                </div>
              </dl>
            </div>
          </div>
          <Button
            v-if="canUpdateProfile"
            variant="outline"
            size="sm"
            class-name="shrink-0"
            @click="goToEditProfile"
          >
            Edit Profile
          </Button>
        </div>

        <div v-else class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No company profile found.
        </div>
      </ComponentCard>

      <!-- Summary + distribution -->
      <div class="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <SummaryCard
          title="Organization Summary"
          :items="[
            { label: 'Total Units', value: stats?.totalUnits ?? 0 },
            { label: 'Active Units', value: stats?.activeUnits ?? 0 },
            { label: 'Total Positions', value: stats?.totalPositions ?? 0 },
            { label: 'Active Positions', value: stats?.activePositions ?? 0 },
          ]"
        />
        <TrendChart
          title="Units by Type"
          series-name="Units"
          :categories="chartCategories"
          :values="chartValues"
        />
      </div>

      <!-- Hierarchy tree -->
      <ComponentCard title="Organization Structure" desc="Click a unit name to open its detail page.">
        <div class="flex justify-end">
          <Button v-if="canWrite" variant="primary" size="sm" @click="goToCreate">
            + Add Root Unit
          </Button>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
          <AppSpinner size="lg" />
        </div>

        <p
          v-else-if="!tree.length"
          class="py-10 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No units yet. Start by adding the top-level directorate.
        </p>

        <OrgTree
          v-else
          :nodes="tree"
          :can-write="canWrite"
          :can-delete="canDelete"
          @select="goToDetail"
          @edit="goToEdit"
          @add-child="goToAddChild"
          @toggle-active="handleToggleActive"
          @delete="handleDeleteUnit"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
