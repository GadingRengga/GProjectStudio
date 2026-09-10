// src/router/routes/demo.routes.ts
// TailAdmin template demo pages — kept during Phase 0 as UI reference only.
// Prune this file (and the src/views demo folders) before Phase 1 module work starts.
import type { RouteRecordRaw } from 'vue-router'

export const demoRoutes: RouteRecordRaw[] = [
  {
    path: '/demo',
    name: 'Ecommerce',
    component: () => import('@/views/Ecommerce.vue'),
    meta: { title: 'eCommerce Dashboard' },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/Others/Calendar.vue'),
    meta: { title: 'Calendar' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Others/UserProfile.vue'),
    meta: { title: 'Profile' },
  },
  {
    path: '/form-elements',
    name: 'Form Elements',
    component: () => import('@/views/Forms/FormElements.vue'),
    meta: { title: 'Form Elements' },
  },
  {
    path: '/basic-tables',
    name: 'Basic Tables',
    component: () => import('@/views/Tables/BasicTables.vue'),
    meta: { title: 'Basic Tables' },
  },
  {
    path: '/line-chart',
    name: 'Line Chart',
    component: () => import('@/views/Chart/LineChart/LineChart.vue'),
  },
  {
    path: '/bar-chart',
    name: 'Bar Chart',
    component: () => import('@/views/Chart/BarChart/BarChart.vue'),
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/views/UiElements/Alerts.vue'),
    meta: { title: 'Alerts' },
  },
  {
    path: '/avatars',
    name: 'Avatars',
    component: () => import('@/views/UiElements/Avatars.vue'),
    meta: { title: 'Avatars' },
  },
  {
    path: '/badge',
    name: 'Badge',
    component: () => import('@/views/UiElements/Badges.vue'),
    meta: { title: 'Badge' },
  },
  {
    path: '/buttons',
    name: 'Buttons',
    component: () => import('@/views/UiElements/Buttons.vue'),
    meta: { title: 'Buttons' },
  },
  {
    path: '/images',
    name: 'Images',
    component: () => import('@/views/UiElements/Images.vue'),
    meta: { title: 'Images' },
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('@/views/UiElements/Videos.vue'),
    meta: { title: 'Videos' },
  },
  {
    path: '/blank',
    name: 'Blank',
    component: () => import('@/views/Pages/BlankPage.vue'),
    meta: { title: 'Blank' },
  },
]
