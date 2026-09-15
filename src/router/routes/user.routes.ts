// src/router/routes/user.routes.ts
// Access Control module — admin-only, including the route-level gate.
//
// ️ meta.roles is Security Layer 1 (UX only, per docs/ARCHITECTURE.md). The real
// gate is Layer 2: the "user_roles_manage" RLS policy plus the admin gate inside
// the SECURITY DEFINER functions in 0006_access_control.sql.
import type { RouteRecordRaw } from 'vue-router'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'user-list',
    component: () => import('@/views/users/UserListView.vue'),
    meta: { title: 'Users & Roles', roles: ['admin'] },
  },
  // NOTE: '/users/new' must stay ABOVE '/users/:id' or it would be swallowed by
  // the :id param route.
  {
    path: '/users/new',
    name: 'user-create',
    component: () => import('@/views/users/UserFormView.vue'),
    meta: { title: 'Add User', roles: ['admin'] },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('@/views/users/UserDetailView.vue'),
    meta: { title: 'User Detail', roles: ['admin'] },
  },
  {
    path: '/users/:id/edit',
    name: 'user-edit',
    component: () => import('@/views/users/UserFormView.vue'),
    meta: { title: 'Edit User Role', roles: ['admin'] },
  },
]