// src/composables/useMenu.ts
// Views/components only interact with this composable.
// This composable has NO knowledge of which database is being used.
//
// Security Layer 1 (UI only): rows are filtered by `allowed_roles` and by
// can('read', resource). The real gate stays in each module's RLS policy.
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { menuRepository } from '@/repositories'
import type { AppMenuRow, SidebarMenuGroup, SidebarMenuItem } from '@/types/menu.types'
import { useAuthStore } from '@/stores/auth.store'
import type { AppRole } from '@/types/auth.types'
import { usePermission } from './usePermission'
import { DocsIcon, GridIcon, ListIcon, PieChartIcon, UserCircleIcon } from '@/icons'

// DB `icon` string -> component. Unknown names fall back to GridIcon.
const ICON_MAP: Record<string, Component> = {
  GridIcon,
  UserCircleIcon,
  ListIcon,
  DocsIcon,
  PieChartIcon,
}

export function resolveMenuIcon(name: string | null): Component {
  return (name && ICON_MAP[name]) || GridIcon
}

// Sidebar group order — unlisted groups sort alphabetically after these.
export const MENU_GROUP_ORDER = ['Main', 'ERP Modules', 'Administration']

// Module-level cache: one fetch per app load, shared by every caller.
export const menuRows = ref<AppMenuRow[]>([])
export const menuLoaded = ref(false)
export const menuLoading = ref(false)
export const menuError = ref<string | null>(null)
export let menuFetchPromise: Promise<void> | null = null
export function setMenuFetchPromise(p: Promise<void> | null): void {
  menuFetchPromise = p
}

export interface FallbackItem {
  group: string
  label: string
  icon: Component
  path: string
  resource: AppMenuRow['resource']
  order: number
}

// Shown when the DB is unreachable or nothing is seeded yet (offline dev,
// fresh project before running seeders/002). Filtered by the same rules
// as DB rows, so no role ever sees extra items.
export const FALLBACK_MENU_ITEMS: FallbackItem[] = [
  { group: 'Main', label: 'Dashboard', icon: GridIcon, path: '/', resource: null, order: 10 },
  { group: 'ERP Modules', label: 'Customers', icon: UserCircleIcon, path: '/customers', resource: 'customers', order: 10 },
  { group: 'ERP Modules', label: 'Services', icon: ListIcon, path: '/services', resource: 'services', order: 20 },
  { group: 'ERP Modules', label: 'Organization', icon: UserCircleIcon, path: '/organization', resource: 'organization', order: 30 },
  { group: 'Administration', label: 'Users & Roles', icon: UserCircleIcon, path: '/users', resource: 'users', order: 10 },
]

export type MenuCanRead = (resource: NonNullable<AppMenuRow['resource']>) => boolean

export function buildGroupsFromRows(
  allRows: AppMenuRow[],
  role: AppRole,
  canRead: MenuCanRead,
): SidebarMenuGroup[] {
  const visible = allRows.filter(
    (row) => row.allowedRoles.includes(role) && (row.resource === null || canRead(row.resource)),
  )
  const parents = visible.filter((row) => row.parentKey === null)
  const parentKeys = new Set(parents.map((p) => p.key))
  const childrenByParent = new Map<string, AppMenuRow[]>()
  for (const row of visible) {
    if (row.parentKey === null) continue
    const list = childrenByParent.get(row.parentKey) ?? []
    list.push(row)
    childrenByParent.set(row.parentKey, list)
  }
  const entries: Array<{ group: string; order: number; item: SidebarMenuItem }> = []
  for (const parent of parents) {
    const children = (childrenByParent.get(parent.key) ?? [])
      .filter((child) => child.path !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    // A parent without a path renders only with visible children (never empty).
    if (parent.path === null && children.length === 0) continue
    const item: SidebarMenuItem = { name: parent.label, icon: resolveMenuIcon(parent.icon) }
    if (parent.path !== null) {
      item.path = parent.path
    } else {
      item.subItems = children.map((child) => ({ name: child.label, path: child.path as string }))
    }
    entries.push({ group: parent.groupTitle, order: parent.sortOrder, item })
  }
  // Orphan children (parent filtered out or missing) render as direct links.
  for (const row of visible) {
    if (row.parentKey === null || row.path === null) continue
    if (row.parentKey !== null && parentKeys.has(row.parentKey)) continue
    entries.push({
      group: row.groupTitle,
      order: row.sortOrder,
      item: { name: row.label, icon: resolveMenuIcon(row.icon), path: row.path },
    })
  }
  return groupMenuItems(entries)
}

export function groupMenuItems(
  entries: Array<{ group: string; order: number; item: SidebarMenuItem }>,
): SidebarMenuGroup[] {
  const byGroup = new Map<string, Array<{ order: number; item: SidebarMenuItem }>>()
  for (const entry of entries) {
    const list = byGroup.get(entry.group) ?? []
    list.push({ order: entry.order, item: entry.item })
    byGroup.set(entry.group, list)
  }
  const rank = (title: string): number => {
    const i = MENU_GROUP_ORDER.indexOf(title)
    return i === -1 ? MENU_GROUP_ORDER.length : i
  }
  return [...byGroup.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([title, list]) => ({
      title,
      items: list.sort((a, b) => a.order - b.order).map((e) => e.item),
    }))
}
// useMenu() — fetches via menuRepository, filters by role + can('read').
// Falls back to FALLBACK_MENU_ITEMS when the DB is unreachable / unseeded.
export function useMenu() {
  const authStore = useAuthStore()
  const { can } = usePermission()

  async function fetchMenus(): Promise<void> {
    if (menuLoaded.value) return
    if (menuFetchPromise) return menuFetchPromise
    const p: Promise<void> = (async () => {
      menuLoading.value = true
      menuError.value = null
      try {
        menuRows.value = await menuRepository.getActiveMenus()
        menuLoaded.value = true
      } catch (e) {
        menuError.value = (e as Error).message
      } finally {
        menuLoading.value = false
        setMenuFetchPromise(null)
      }
    })()
    setMenuFetchPromise(p)
    return p
  }

  async function refreshMenus(): Promise<void> {
    menuLoaded.value = false
    await fetchMenus()
  }

  const menuGroups = computed<SidebarMenuGroup[]>(() => {
    const role: AppRole = authStore.role ?? 'viewer'
    const canRead: MenuCanRead = (resource) => can('read', resource)
    if (menuRows.value.length > 0) return buildGroupsFromRows(menuRows.value, role, canRead)
    return groupMenuItems(
      FALLBACK_MENU_ITEMS.filter(
        (item) => item.resource === null || canRead(item.resource),
      ).map((item) => ({
        group: item.group,
        order: item.order,
        item: { name: item.label, icon: item.icon, path: item.path },
      })),
    )
  })

  return {
    menuGroups: computed(() => menuGroups.value),
    loading: computed(() => menuLoading.value),
    error: computed(() => menuError.value),
    fetchMenus,
    refreshMenus,
  }
}