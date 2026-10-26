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
  /** Other routes that should keep this tab highlighted (e.g. bill definition off Installments). */
  alsoActiveOn?: string[]
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
  {
    to: '/installments',
    label: 'Installments',
    shortLabel: 'Due',
    icon: 'installments',
    activePrefix: '/installments',
    alsoActiveOn: ['/bills'],
  },
  {
    to: '/expenses',
    label: 'Expenses',
    shortLabel: 'Spend',
    icon: 'expenses',
    activePrefix: '/expenses',
  },
]

function pathMatchesNavItem(path: string, item: AppNavItem): boolean {
  if (item.exact) return path === item.to
  const prefixes = [item.activePrefix, ...(item.alsoActiveOn ?? [])]
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function appNavActiveIndex(route: RouteLocationNormalizedLoaded): number {
  const index = APP_NAV_ITEMS.findIndex((item) => pathMatchesNavItem(route.path, item))
  return index >= 0 ? index : 0
}
