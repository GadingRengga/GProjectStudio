// src/repositories/interfaces/IMenuRepository.ts
// This file is NEVER changed during database migration.
// It is the "contract" — any implementation must match this shape exactly.

import type { AppMenuRow } from '@/types/menu.types'

export interface IMenuRepository {
  /** Returns all active menu rows, ordered by group then sort_order. */
  getActiveMenus(): Promise<AppMenuRow[]>
}
