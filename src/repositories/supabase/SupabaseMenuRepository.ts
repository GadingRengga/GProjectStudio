// src/repositories/supabase/SupabaseMenuRepository.ts
// The ONLY place allowed to import the supabase client for menus.
// On migration: create a new file (e.g. RestMenuRepository.ts), do not delete this one yet.

import { supabase } from '@/lib/supabase'
import type { IMenuRepository } from '../interfaces/IMenuRepository'
import type { AppMenuRow, MenuResource } from '@/types/menu.types'

// Maps snake_case DB columns to camelCase TypeScript properties
function mapRowToAppMenu(row: Record<string, unknown>): AppMenuRow {
  return {
    id: row.id as string,
    key: row.key as string,
    groupTitle: row.group_title as string,
    label: row.label as string,
    path: (row.path as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    parentKey: (row.parent_key as string | null) ?? null,
    resource: (row.resource as MenuResource | null) ?? null,
    allowedRoles: (row.allowed_roles as string[] | null) ?? [],
    sortOrder: row.sort_order as number,
    isActive: row.is_active as boolean,
  }
}

export class SupabaseMenuRepository implements IMenuRepository {
  async getActiveMenus(): Promise<AppMenuRow[]> {
    const { data, error } = await supabase
      .from('app_menus')
      .select('*')
      .eq('is_active', true)
      .order('group_title', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToAppMenu)
  }
}
