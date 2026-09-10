// src/router/guards.ts
// Auth guard + role guard.
// ⚠️ Security Layer 1 (frontend, UX only) — the real gate is database RLS (docs/ARCHITECTURE.md).
import type { Router } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** Public routes skip the auth check (e.g. login page). */
    public?: boolean
    /** If set, the user's role must be one of these (checked after auth). */
    roles?: string[]
  }
}

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    // Restore any persisted session before the first navigation decides.
    const { ensureInitialized } = useAuth()
    await ensureInitialized()

    const authStore = useAuthStore()

    // Auth guard: everything is protected unless meta.public === true.
    if (!authStore.isAuthenticated && to.meta.public !== true) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // Already signed in → no reason to see the login page.
    if (authStore.isAuthenticated && to.name === 'login') {
      return { path: '/' }
    }

    // Role guard: route-level gate (UI only — mirror it with RLS policies).
    const requiredRoles = to.meta.roles
    if (requiredRoles?.length) {
      const hasRequiredRole = authStore.role !== null && requiredRoles.includes(authStore.role)
      if (!hasRequiredRole) return { path: '/' }
    }

    document.title = to.meta.title
      ? `${to.meta.title} | ${import.meta.env.VITE_APP_NAME}`
      : import.meta.env.VITE_APP_NAME

    return true
  })
}
