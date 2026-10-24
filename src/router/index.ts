import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/pages/TransactionsPage.vue'),
    },
  ],
})

export default router
