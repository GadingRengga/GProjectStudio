// src/router/routes/organization.routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const organizationRoutes: RouteRecordRaw[] = [
  {
    path: '/organization',
    name: 'organization-overview',
    component: () => import('@/views/organization/OrganizationView.vue'),
    meta: { title: 'Organization' },
  },
  {
    path: '/organization/units/new',
    name: 'organization-unit-create',
    component: () => import('@/views/organization/UnitFormView.vue'),
    meta: { title: 'New Unit' },
  },
  {
    path: '/organization/units/:id',
    name: 'organization-unit-detail',
    component: () => import('@/views/organization/UnitDetailView.vue'),
    meta: { title: 'Unit Detail' },
  },
  {
    path: '/organization/units/:id/edit',
    name: 'organization-unit-edit',
    component: () => import('@/views/organization/UnitFormView.vue'),
    meta: { title: 'Edit Unit' },
  },
  {
    path: '/organization/profile/edit',
    name: 'organization-profile-edit',
    component: () => import('@/views/organization/CompanyProfileFormView.vue'),
    meta: { title: 'Edit Company Profile' },
  },
]
