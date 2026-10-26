import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type AppNavIconName =
  | 'home'
  | 'ledger'
  | 'deposits'
  | 'bills'
  | 'installments'
  | 'expenses'

export interface AppNavItem {
  to: string
  label: string
  /** Short label under the raised icon. */
  shortLabel: string
  icon: AppNavIconName
  /** Path prefix used to mark the tab active (also matches nested routes). */
  activePrefix: string
  exact?: boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: 'home',
    activePrefix: '/dashboard',
    exact: true,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    shortLabel: 'Ledger',
    icon: 'ledger',
    activePrefix: '/transactions',
  },
  {
    to: '/deposits',
    label: 'Deposits',
    shortLabel: 'Deposits',
    icon: 'deposits',
    activePrefix: '/deposits',
  },
  { to: '/bills', label: 'Bills', shortLabel: 'Bills', icon: 'bills', activePrefix: '/bills' },
  {
    to: '/installments',
    label: 'Installments',
    shortLabel: 'Due',
    icon: 'installments',
    activePrefix: '/installments',
  },
  {
    to: '/expenses',
    label: 'Expenses',
    shortLabel: 'Spend',
    icon: 'expenses',
    activePrefix: '/expenses',
  },
]

export function appNavActiveIndex(route: RouteLocationNormalizedLoaded): number {
  const index = APP_NAV_ITEMS.findIndex((item) => {
    if (item.exact) return route.path === item.to
    return route.path === item.activePrefix || route.path.startsWith(`${item.activePrefix}/`)
  })
  return index >= 0 ? index : 0
}
