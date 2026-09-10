// src/types/auth.types.ts
// Application-level auth types — intentionally provider-agnostic.
// No Supabase types leak into the app; mapping happens in composables/useAuth.ts.

export type AppRole = 'admin' | 'staff' | 'viewer'

export interface AuthUser {
  id: string
  email: string | null
  fullName?: string
  avatarUrl?: string
}
