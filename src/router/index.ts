import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import '@/types/router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/pages/LandingPage.vue'),
      meta: { public: true, hideChrome: true, fullBleed: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/AuthPage.vue'),
      meta: { public: true, hideChrome: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/pages/TransactionsPage.vue'),
    },
    {
      path: '/deposits',
      name: 'deposits',
      component: () => import('@/pages/DepositsPage.vue'),
    },
    {
      path: '/bills/:id?',
      name: 'bills',
      component: () => import('@/pages/BillsPage.vue'),
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: () => import('@/pages/ExpensesPage.vue'),
    },
    {
      path: '/expenses/entry/:id?',
      name: 'expense-entry',
      component: () => import('@/pages/ExpenseEntryPage.vue'),
    },
    {
      path: '/installments',
      name: 'installments',
      component: () => import('@/pages/InstallmentsPage.vue'),
    },
    {
      path: '/installments/:id',
      name: 'installment-detail',
      component: () => import('@/pages/InstallmentDetailPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.public) {
    if (isAuthenticated.value && (to.name === 'login' || to.name === 'landing')) {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
