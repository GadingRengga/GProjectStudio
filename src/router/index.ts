import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import { authRoutes } from './routes/auth.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { customerRoutes } from './routes/customer.routes'
import { serviceRoutes } from './routes/service.routes'
import { demoRoutes } from './routes/demo.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
    ...customerRoutes,
    ...serviceRoutes,
    ...demoRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/Errors/FourZeroFour.vue'),
      meta: {
        title: 'Page Not Found',
        public: true,
      },
    },
  ],
})

setupRouterGuards(router)

export default router

