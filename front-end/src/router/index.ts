import { createRouter, createWebHistory } from 'vue-router'
import { ensureAuthReady, useAuth } from '@/composables/useAuth'
import { beginLoading, endLoading, setLoadingOverlaySuppressed } from '@/composables/useLoadingOverlay'
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
      meta: { public: true, hideChrome: true, skipLoadingOverlay: true },
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
      path: '/bills/entry/:id?',
      name: 'bill-entry',
      component: () => import('@/pages/BillEntryPage.vue'),
      meta: { skipLoadingOverlay: true },
    },
    {
      path: '/bills',
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
      meta: { skipLoadingOverlay: true },
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
      meta: { skipLoadingOverlay: true },
    },
  ],
})

router.beforeEach(async (to, from) => {
  const skipOverlay = Boolean(to.meta.skipLoadingOverlay)
  setLoadingOverlaySuppressed(skipOverlay)
  if (to.fullPath !== from.fullPath && !skipOverlay) beginLoading()
  await ensureAuthReady()
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

router.afterEach((to, from) => {
  if (to.fullPath !== from.fullPath && !to.meta.skipLoadingOverlay) endLoading()
})

export default router
