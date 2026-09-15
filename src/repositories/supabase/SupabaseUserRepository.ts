// src/repositories/supabase/SupabaseUserRepository.ts
// The ONLY place allowed to import the supabase client for users/roles.
//
// NOTE — this is the first repository in the codebase that calls an RPC instead
// of `.from()`. Reason: `auth.users` (and therefore the email address) is not
// exposed by PostgREST, so the directory is read through the SECURITY DEFINER
// functions defined in supabase/migrations/0006_access_control.sql. Those
// functions carry the admin gate in their own body — the gate is NOT enforced
// here, and it must not be, because this layer is the client.
//
// Role WRITES, by contrast, go straight through the `user_roles` table: the
// "user_roles_manage" RLS policy already allows admin-only INSERT/UPDATE/DELETE
// (0002_rls_policies.sql), so no Edge Function and no extra RPC is needed.
// Every change made here is recorded by the existing `audit_user_roles` trigger.

import { supabase } from '@/lib/supabase'
import type { IUserRepository } from '../interfaces/IUserRepository'
import type { AppRole } from '@/types/auth.types'
import type { AppUser, UserStats } from '@/types/user.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

function mapRpcRowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.user_id as string,
    email: (row.email as string | null) ?? null,
    role: (row.role as AppRole | null) ?? null,
    createdAt: row.created_at as string,
    lastSignInAt: (row.last_sign_in_at as string | null) ?? null,
  }
}

export class SupabaseUserRepository implements IUserRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<AppUser>> {
    const { page, perPage, search, sortBy = 'created_at', sortDir = 'desc' } = params

    const { data, error } = await supabase.rpc('list_app_users', {
      p_page: page,
      p_per_page: perPage,
      p_search: search || null,
      p_sort_by: sortBy,
      p_sort_dir: sortDir,
    })
    if (error) throw new Error(error.message)

    // `.rpc()` returns a bare array, not the { data, count } shape `.from()` gives
    // us. The unpaginated total therefore travels as a column of every row.
    const rows = (data ?? []) as Record<string, unknown>[]
    const total = rows.length ? Number(rows[0].total_count) : 0

    return {
      data: rows.map(mapRpcRowToUser),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    }
  }

  async findById(id: string): Promise<AppUser | null> {
    const { data, error } = await supabase.rpc('get_app_user', { p_user_id: id })
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Record<string, unknown>[]
    return rows.length ? mapRpcRowToUser(rows[0]) : null
  }

  async updateRole(userId: string, role: AppRole): Promise<void> {
    // Plain table write — allowed by the admin-only "user_roles_manage" policy.
    // Upsert because a brand-new account has no user_roles row yet, and onConflict
    // makes "assign first role" and "change role" the same code path.
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    if (error) throw new Error(error.message)
  }

  async revokeAccess(userId: string): Promise<void> {
    // Removing the row is what actually revokes access: every RLS policy in this
    // project is built on get_my_role(), which reads this table live on each
    // request. No row => get_my_role() IS NULL => every policy fails => the account
    // can read and write nothing.
    //
    // This is the P1 substitute for a real ban. A true auth-level ban writes
    // auth.users.banned_until, which requires the service_role key and therefore an
    // Edge Function (Phase 2). Revoking here is immediate, needs no new infra, and
    // is audited by the existing `audit_user_roles` trigger.
    //
    // The last-admin trigger (0006) may reject this — its message is propagated
    // verbatim so the admin sees why.
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  async getStats(): Promise<UserStats> {
    const { data, error } = await supabase.rpc('get_user_stats')
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Record<string, unknown>[]

    // A non-admin gets ZERO rows (the gate filters them out), not a row of zeros.
    // Returning zeros would render a confident but wrong summary; failing loudly
    // surfaces the authorisation problem instead.
    if (!rows.length) throw new Error('Not authorised to read user statistics')

    const row = rows[0]
    return {
      total: Number(row.total_users),
      admins: Number(row.admins),
      staff: Number(row.staffs),
      viewers: Number(row.viewers),
      noAccess: Number(row.no_access),
    }
  }
}
