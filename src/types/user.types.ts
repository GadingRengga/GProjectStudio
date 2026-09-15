// src/types/user.types.ts
// Application-level types for the Access Control (Users & Roles) module.
// Provider-agnostic — no Supabase types leak in here; mapping happens in
// repositories/supabase/SupabaseUserRepository.ts.

import type { AppRole } from './auth.types'

export interface AppUser {
  // auth.users.id. Named `id` (not `userId`) so DataTable's `:key="row.id"`
  // works without a second identifier — see docs/COMPONENTS.md.
  id: string
  email: string | null
  // NULL means the account has NO row in user_roles, i.e. no access at all:
  // get_my_role() returns NULL and every RLS policy fails. This is deliberately
  // not coerced to 'viewer' — that would hide a locked-out account.
  role: AppRole | null
  createdAt: string
  lastSignInAt: string | null // NULL = never signed in
}

export interface UserStats {
  total: number
  admins: number
  staff: number
  viewers: number
  noAccess: number
}