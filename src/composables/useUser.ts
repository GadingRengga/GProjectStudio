// src/composables/useUser.ts
// Views only interact with this composable.
// This composable has NO knowledge of which database is being used.
//
// Access Control is admin-only, mirroring the "user_roles_manage" RLS policy
// (0002_rls_policies.sql) and the SECURITY DEFINER gates in 0006. The guards in
// the views are UX only — the database refuses a non-admin regardless.

import { ref, computed } from 'vue'
import { userRepository } from '@/repositories'
import type { AppRole } from '@/types/auth.types'
import type { AppUser, UserStats } from '@/types/user.types'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import { useToast } from './useToast'

export function useUser() {
  const toast = useToast()

  const users = ref<AppUser[]>([])
  const currentUser = ref<AppUser | null>(null)
  const stats = ref<UserStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResult<AppUser>, 'data'> | null>(null)

  async function fetchUsers(params: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const result = await userRepository.findAll(params)
      users.value = result.data
      pagination.value = {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      }
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load users')
    } finally {
      loading.value = false
    }
  }

  async function fetchUserById(id: string) {
    loading.value = true
    error.value = null
    try {
      currentUser.value = await userRepository.findById(id)
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load user')
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    error.value = null
    try {
      stats.value = await userRepository.getStats()
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load user statistics')
    }
  }

  async function updateRole(userId: string, role: AppRole): Promise<boolean> {
    loading.value = true
    try {
      await userRepository.updateRole(userId, role)
      toast.success(`Role updated to ${role}`)
      return true
    } catch (e) {
      // The last-admin trigger (0006) rejects a demotion with a specific message.
      // Surface it verbatim instead of a generic failure so the admin knows what
      // to do (assign another admin first).
      toast.error((e as Error).message)
      return false
    } finally {
      loading.value = false
    }
  }

  async function revokeAccess(userId: string): Promise<boolean> {
    loading.value = true
    try {
      await userRepository.revokeAccess(userId)
      toast.success('Access revoked')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State (read-only via computed)
    users: computed(() => users.value),
    currentUser: computed(() => currentUser.value),
    stats: computed(() => stats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),

    // Actions
    fetchUsers,
    fetchUserById,
    fetchStats,
    updateRole,
    revokeAccess,
  }
}