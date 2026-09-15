// src/router/routes/customer.routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const customerRoutes: RouteRecordRaw[] = [
  {
    path: '/customers',
    name: 'customer-list',
    component: () => import('@/views/customer/CustomerListView.vue'),
    meta: { title: 'Customers' },
  },
  {
    path: '/customers/new',
    name: 'customer-create',
    component: () => import('@/views/customer/CustomerFormView.vue'),
    meta: { title: 'New Customer' },
  },
  {
    path: '/customers/:id',
    name: 'customer-detail',
    component: () => import('@/views/customer/CustomerDetailView.vue'),
    meta: { title: 'Customer Detail' },
  },
  {
    path: '/customers/:id/edit',
    name: 'customer-edit',
    component: () => import('@/views/customer/CustomerFormView.vue'),
    meta: { title: 'Edit Customer' },
  },
]
