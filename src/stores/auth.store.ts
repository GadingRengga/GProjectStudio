// src/stores/auth.store.ts
// Pinia store — GLOBAL auth state only.
// NO Supabase import here (Architecture Rule #1): state is pushed in by composables/useAuth.ts.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppRole, AuthUser } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const roles = ref<AppRole[]>([])

  const role = computed<AppRole | null>(() => roles.value[0] ?? null)
  const isAuthenticated = computed(() => user.value !== null)

  function setUser(nextUser: AuthUser | null, nextRoles: AppRole[] = []) {
    user.value = nextUser
    roles.value = nextUser === null ? [] : nextRoles
  }

  function clearUser() {
    user.value = null
    roles.value = []
  }

  return { user, roles, role, isAuthenticated, setUser, clearUser }
})
