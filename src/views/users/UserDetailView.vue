 <!-- src/views/users/UserDetailView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { usePermission } from '@/composables/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirm } from '@/composables/useConfirm'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import IconButton from '@/components/atoms/IconButton.vue'
import DetailField from '@/components/molecules/DetailField.vue'
import { ShieldCheck, UserCog, UserX } from 'lucide-vue-next'
import { formatDatetime } from '@/utils/date'
import { roleLabel, roleVariant } from '@/utils/role'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { currentUser, loading, fetchUserById, revokeAccess } = useUser()
const { can } = usePermission()
const { confirm } = useConfirm()

const userId = computed(() => route.params.id as string)
const breadcrumbItems = [{ label: 'Users & Roles', to: '/users' }]
const isSelf = computed(() => authStore.user?.id === userId.value)

onMounted(() => {
  void fetchUserById(userId.value)
})

function goToEdit() {
  router.push({ name: 'user-edit', params: { id: userId.value } })
}

async function handleRevoke() {
  // Refuse to offer self-revocation. The database allows it while another admin
  // exists, but it locks the clicking admin out of the workspace.
  if (!can('delete', 'users') || isSelf.value) return
  const confirmed = await confirm({
    title: 'Revoke Access',
    message: `Revoke access for ${currentUser.value?.email ?? 'this user'}? They keep their login, but cannot read or write any data until a role is assigned again.`,
    confirmText: 'Revoke',
    tone: 'danger',
  })
  if (!confirmed) return
  const ok = await revokeAccess(userId.value)
  if (ok) void fetchUserById(userId.value)
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'User Detail'" :items="breadcrumbItems" />

    <div class="space-y-5 sm:space-y-6">
      <div v-if="loading && !currentUser" class="flex justify-center py-10">
        <AppSpinner size="lg" />
      </div>

      <ComponentCard
        v-else-if="currentUser"
        title="Account"
        desc="Role changes are recorded in the audit log automatically."
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold uppercase text-brand-500 dark:bg-brand-500/10"
            >
              {{ (currentUser.email ?? '?').charAt(0) }}
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {{ currentUser.email ?? '-' }}
                </h3>
                <AppBadge v-if="isSelf" variant="info">You</AppBadge>
              </div>
              <div class="mt-3 flex items-center gap-2">
                <AppBadge :variant="roleVariant(currentUser.role)">
                  {{ roleLabel(currentUser.role) }}
                </AppBadge>
                <span class="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <ShieldCheck class="h-3.5 w-3.5" />
                  Role-managed account
                </span>
              </div>

              <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <DetailField label="Last sign-in">
                  {{ currentUser.lastSignInAt ? formatDatetime(currentUser.lastSignInAt) : 'Never' }}
                </DetailField>
                <DetailField label="Account created">
                  {{ formatDatetime(currentUser.createdAt) }}
                </DetailField>
                <DetailField label="User ID" mono wide>{{ currentUser.id }}</DetailField>
              </dl>
            </div>
          </div>

          <div class="flex shrink-0 gap-3">
            <IconButton
              v-if="can('update', 'users')"
              :icon="UserCog"
              tooltip="Change Role"
              tone="brand"
              size="md"
              @click="goToEdit"
            />
            <IconButton
              v-if="can('delete', 'users') && !isSelf"
              :icon="UserX"
              tooltip="Revoke Access"
              tone="danger"
              size="md"
              @click="handleRevoke"
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard v-else title="Account" desc="This user could not be found.">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          The account may have been deleted, or you do not have permission to view it.
        </p>
        <Button variant="outline" size="sm" @click="router.push({ name: 'user-list' })">
          Back to Users
        </Button>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>