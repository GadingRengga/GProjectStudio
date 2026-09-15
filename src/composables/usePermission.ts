// src/composables/usePermission.ts
// Controls what each role can see and do in the UI.
// IMPORTANT: This is UI-only protection (Security Layer 1). Real security is enforced
// by database RLS (Layer 2) — never skip RLS just because this composable blocks the UI.
import { useAuthStore } from '@/stores/auth.store'

type Action = 'create' | 'read' | 'update' | 'delete'
type Resource =
  | 'customers'
  | 'services'
  | 'orders'
  | 'projects'
  | 'invoices'
  | 'transactions'
  | 'organization'
  | 'company_profile'

// Define what each role can do
const PERMISSIONS: Record<string, Record<Resource, Action[]>> = {
  admin: {
    customers: ['create', 'read', 'update', 'delete'],
    services: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete'],
    transactions: ['create', 'read', 'update', 'delete'],
    organization: ['create', 'read', 'update', 'delete'],
    company_profile: ['read', 'update'],
  },
  staff: {
    customers: ['create', 'read', 'update'],
    services: ['read'],
    orders: ['create', 'read', 'update'],
    projects: ['create', 'read', 'update'],
    invoices: ['create', 'read', 'update'],
    transactions: ['read'],
    organization: ['create', 'read', 'update'],
    company_profile: ['read'],
  },
  viewer: {
    customers: ['read'],
    services: ['read'],
    orders: ['read'],
    projects: ['read'],
    invoices: ['read'],
    transactions: [],
    organization: ['read'],
    company_profile: ['read'],
  },
}

export function usePermission() {
  const authStore = useAuthStore()

  function can(action: Action, resource: Resource): boolean {
    const role = authStore.role ?? 'viewer'
    return PERMISSIONS[role]?.[resource]?.includes(action) ?? false
  }

  function canAny(actions: Action[], resource: Resource): boolean {
    return actions.some((action) => can(action, resource))
  }

  return { can, canAny }
}
