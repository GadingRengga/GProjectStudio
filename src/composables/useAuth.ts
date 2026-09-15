// src/composables/useAuth.ts
// Auth abstraction. Vue has no knowledge of Supabase outside this file and lib/supabase.ts.
// Documented exception to Architecture Rule #1 (docs/DATA-LAYER.md):
// "On migration: change ONLY this file and lib/supabase.ts. All callers require zero changes."
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import type { AppRole, AuthUser } from '@/types/auth.types'
import type { User } from '@supabase/supabase-js'

const loading = ref(false)

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: typeof metadata.full_name === 'string' ? metadata.full_name : undefined,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
  }
}

// Reads the user's role(s) from the user_roles table (RLS allows reading your own row).
async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  if (error || !data) return []
  return data.map((row) => row.role as AppRole)
}

async function syncUser(user: User, authStore: ReturnType<typeof useAuthStore>) {
  const roles = await fetchRoles(user.id)
  authStore.setUser(mapSupabaseUser(user), roles)
}

// Restores the session on page load and keeps the store in sync with auth events.
// initPromise makes this idempotent across every useAuth() caller and the router guard.
let initPromise: Promise<void> | null = null

function ensureInitialized(): Promise<void> {
  initPromise ??= (async () => {
    const authStore = useAuthStore()

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        authStore.clearUser()
      } else if (session?.user) {
        void syncUser(session.user, authStore)
      }
    })

    const { data } = await supabase.auth.getSession()
    const sessionUser = data.session?.user ?? null
    if (sessionUser) await syncUser(sessionUser, authStore)
  })()
  return initPromise
}

export function useAuth() {
  const authStore = useAuthStore()

  async function login(email: string, password: string): Promise<string | null> {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      if (data.user) await syncUser(data.user, authStore)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Unexpected login error.'
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    authStore.clearUser()
  }

  async function forgotPassword(email: string): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return !error
  }

  return {
    ensureInitialized,
    login,
    logout,
    forgotPassword,
    loading: computed(() => loading.value),
    currentUser: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    hasRole: (role: AppRole) => authStore.roles.includes(role),
  }
}
