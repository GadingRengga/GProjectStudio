 <!-- src/views/users/UserFormView.vue -->
<!-- Serves TWO routes: /users/new (create) and /users/:id/edit (change role). -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import type { AppRole } from '@/types/auth.types'
import { ROLE_OPTIONS, roleVariant } from '@/utils/role'

const route = useRoute()
const router = useRouter()
const { currentUser, loading, fetchUserById, updateRole } = useUser()
const { can } = usePermission()

const isCreate = computed(() => route.name === 'user-create')
const userId = computed(() => route.params.id as string)

const breadcrumbItems = computed(() => [
  { label: 'Users & Roles', to: '/users' },
  isCreate.value ? { label: 'Add User' } : { label: 'Detail', to: `/users/${userId.value}` },
])

const selectedRole = ref<AppRole | null>(null)
const saving = ref(false)

onMounted(async () => {
  if (isCreate.value) return
  await fetchUserById(userId.value)
  selectedRole.value = currentUser.value?.role ?? null
})

const currentRole = computed(() => currentUser.value?.role ?? null)

// Saving is a no-op unless the role actually changes. This is not just cosmetic:
// re-writing an unchanged admin row still runs the last-admin BEFORE UPDATE trigger.
const canSave = computed(
  () =>
    can('update', 'users') &&
    selectedRole.value !== null &&
    selectedRole.value !== currentRole.value,
)

async function handleSubmit() {
  if (!canSave.value || !selectedRole.value) return
  saving.value = true
  const ok = await updateRole(userId.value, selectedRole.value)
  saving.value = false
  if (ok) router.push({ name: 'user-detail', params: { id: userId.value } })
}

function goBack() {
  if (isCreate.value) router.push({ name: 'user-list' })
  else router.push({ name: 'user-detail', params: { id: userId.value } })
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="isCreate ? 'Add User' : 'Change Role'" :items="breadcrumbItems" />

    <div class="space-y-5 sm:space-y-6">
      <!-- CREATE: not possible from the browser. Say so plainly instead of showing
           a form that cannot work. -->
      <ComponentCard
        v-if="isCreate"
        title="Creating an account"
        desc="Accounts are created in the Supabase dashboard, then given a role here."
      >
        <ol class="list-decimal space-y-4 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>
            Open
            <span class="font-medium text-gray-800 dark:text-white/90"
              >Supabase Dashboard → Authentication → Users</span
            >, then choose
            <span class="font-medium text-gray-800 dark:text-white/90">Add user</span>.
          </li>
          <li>
            Enter the email and a password, and enable
            <span class="font-medium text-gray-800 dark:text-white/90">Auto Confirm User</span>
            so the account can sign in straight away.
          </li>
          <li>
            Return to this page and
            <span class="font-medium text-gray-800 dark:text-white/90">assign a role</span>. A fresh
            account has no access until a role is assigned.
          </li>
        </ol>

        <div
          class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <p class="font-medium">Why this is not a form yet</p>
          <p class="mt-1">
            Creating a user goes through the Supabase Admin API, which needs the
            <code>service_role</code> key. That key must never reach the browser, so this becomes a
            real form only once the Phase 2 Edge Function is deployed. Listing accounts and assigning
            roles already work today.
          </p>
        </div>

        <div>
          <Button variant="primary" size="sm" @click="goBack">Back to Users</Button>
        </div>
      </ComponentCard>

      <!-- EDIT: the role picker. This is the action that actually grants access. -->
      <template v-else>
        <div v-if="loading && !currentUser" class="flex justify-center py-10">
          <AppSpinner size="lg" />
        </div>

        <ComponentCard
          v-else-if="currentUser"
          title="Role"
          desc="The role is the only thing that grants this account access to data."
        >
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {{ currentUser.email ?? '-' }}
            </p>
            <p class="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              Current role:
              <AppBadge :variant="roleVariant(currentRole)">
                {{ currentRole ?? 'No access' }}
              </AppBadge>
            </p>
          </div>

          <div class="space-y-3">
            <label
              v-for="option in ROLE_OPTIONS"
              :key="option.value"
              class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition"
              :class="
                selectedRole === option.value
                  ? 'border-brand-500 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
              "
            >
              <input
                v-model="selectedRole"
                type="radio"
                name="role"
                :value="option.value"
                class="mt-1"
              />
              <span>
                <AppBadge :variant="roleVariant(option.value)">{{ option.label }}</AppBadge>
                <span class="mt-1.5 block text-sm text-gray-500 dark:text-gray-400">
                  {{ option.description }}
                </span>
              </span>
            </label>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            The last remaining admin cannot be demoted or removed — assign another admin first.
          </p>

          <div class="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" :disabled="!canSave || saving" @click="handleSubmit">
              {{ saving ? 'Saving…' : 'Save Role' }}
            </Button>
            <Button variant="outline" size="sm" @click="goBack">Cancel</Button>
          </div>
        </ComponentCard>

        <ComponentCard v-else title="Role" desc="This user could not be found.">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            The account may have been deleted, or you do not have permission to view it.
          </p>
          <Button variant="outline" size="sm" @click="goBack">Back to Users</Button>
        </ComponentCard>
      </template>
    </div>
  </AdminLayout>
</template>
