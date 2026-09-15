// src/router/routes/service.routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const serviceRoutes: RouteRecordRaw[] = [
  {
    path: '/services',
    name: 'service-list',
    component: () => import('@/views/service/ServiceListView.vue'),
    meta: { title: 'Services' },
  },
  {
    path: '/services/new',
    name: 'service-create',
    component: () => import('@/views/service/ServiceFormView.vue'),
    meta: { title: 'New Service' },
  },
  {
    path: '/services/:id',
    name: 'service-detail',
    component: () => import('@/views/service/ServiceDetailView.vue'),
    meta: { title: 'Service Detail' },
  },
  {
    path: '/services/:id/edit',
    name: 'service-edit',
    component: () => import('@/views/service/ServiceFormView.vue'),
    meta: { title: 'Edit Service' },
  },
]