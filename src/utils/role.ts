// src/utils/role.ts
// Presentation helpers for AppRole, shared by the three Access Control views so
// the meaning of "no role" is defined exactly once.
//
// A NULL role is NOT a neutral value. It means the account has no row in
// user_roles, so get_my_role() returns NULL and EVERY RLS policy fails — the user
// can sign in but reads and writes nothing. It is therefore rendered as a warning
// ("No access"), never as the 'viewer' label, which would misreport a locked-out
// account as a read-only one.
import type { AppRole } from '@/types/auth.types'

export type RoleBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

/** Role picker options. Descriptions must stay truthful to PERMISSIONS in usePermission.ts. */
export const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to every module, including users and roles.',
  },
  {
    value: 'staff',
    label: 'Staff',
    description:
      'Create and update operational records; cannot delete. Read-only on Services and Transactions.',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to operational records. No access to Transactions.',
  },
]

export function roleLabel(role: AppRole | null): string {
  if (!role) return 'No access'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

/** Admin is the high-privilege role, so it reads as 'danger'; no role is a warning. */
export function roleVariant(role: AppRole | null): RoleBadgeVariant {
  if (!role) return 'warning'
  if (role === 'admin') return 'danger'
  return role === 'staff' ? 'info' : 'default'
}