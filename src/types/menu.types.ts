// src/types/menu.types.ts
// Dynamic sidebar menu types — rows come from the `app_menus` table
// (supabase/migrations/0007_app_menus.sql), shaped here for AppSidebar.
// Created BEFORE anything else (docs/AI-GUIDELINES.md checklist #4).
import type { Component } from 'vue'

// Mirrors the Resource union in composables/usePermission.ts — a menu row
// with `resource` set is only shown when can('read', resource) passes.
export type MenuResource =
  | 'customers'
  | 'services'
  | 'orders'
  | 'projects'
  | 'invoices'
  | 'transactions'
  | 'organization'
  | 'company_profile'
  | 'users'

export interface AppMenuRow {
  id: string
  key: string
  groupTitle: string
  label: string
  path: string | null
  icon: string | null
  parentKey: string | null
  resource: MenuResource | null
  allowedRoles: string[]
  sortOrder: number
  isActive: boolean
}

export interface SidebarSubItem {
  name: string
  path: string
}

export interface SidebarMenuItem {
  name: string
  icon: Component
  path?: string
  subItems?: SidebarSubItem[]
}

export interface SidebarMenuGroup {
  title: string
  items: SidebarMenuItem[]
}
