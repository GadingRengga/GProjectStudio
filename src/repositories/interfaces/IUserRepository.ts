// src/repositories/interfaces/IUserRepository.ts
// Provider-agnostic contract for the Access Control (Users & Roles) module.
// The composable depends on THIS, never on the Supabase implementation
// (docs/DATA-LAYER.md).

import type { AppRole } from '@/types/auth.types'
import type { AppUser, UserStats } from '@/types/user.types'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'

export interface IUserRepository {
  findAll(params: PaginationParams): Promise<PaginatedResult<AppUser>>
  findById(id: string): Promise<AppUser | null>
  /** Assign or change a role. Creates the user_roles row if it does not exist. */
  updateRole(userId: string, role: AppRole): Promise<void>
  /** Revoke all access by deleting the user_roles row (see Supabase impl for why). */
  revokeAccess(userId: string): Promise<void>
  getStats(): Promise<UserStats>
}