# Architecture map

Keep this file in sync with the code. It should let an agent understand the project without opening every file.

## Stack
- Vue 3.5 (`<script setup lang="ts">`), TypeScript 6, Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS)
- Vue Router 5 (`createWebHistory`, lazy-loaded pages)
- Path alias: `@` → `src` (set in `vite.config.ts` and `tsconfig.app.json`)
- Persistence: `localStorage` (no backend yet)

## Routes
| Path | Name | Page |
| --- | --- | --- |
| `/` | `dashboard` | `pages/DashboardPage.vue` |
| `/transactions` | `transactions` | `pages/TransactionsPage.vue` |

## Pages and their components
### DashboardPage → `components/Dashboard/`
- `SummaryCards.vue` — reads totals from `useTransactions`, renders 3 `SummaryCard`s
- `SummaryCard.vue` — presentational; props `label`, `amount`, `tone: primary|success|danger`
- `RecentTransactions.vue` — last 5 transactions from `useTransactions`

### TransactionsPage → `components/Transactions/`
- `TransactionForm.vue` — local form state + validation, calls `addTransaction`
- `TransactionList.vue` — all transactions, calls `removeTransaction`

## Shared components (`components/shared/`)
- `AppNavbar.vue` — top navigation (links array inside the component)
- `PageHeader.vue` — props `title`, `subtitle?`
- `BaseCard.vue` — surface container; prop `title?`, default slot
- `BaseButton.vue` — props `variant: primary|danger|ghost`, `type: button|submit`
- `TransactionItem.vue` — one transaction row; props `transaction`, `removable?`; emits `remove(id)`

## Composables (`composables/`)
- `useTransactions.ts` — module-level shared state (singleton), synced to `localStorage` key `money-managment:transactions`.
  Returns `transactions` (readonly), `totalIncome`, `totalExpense`, `balance`, `addTransaction(NewTransaction)`, `removeTransaction(id)`.

## Types (`types/`)
- `transaction.ts` — `TransactionType = 'income' | 'expense'`, `Transaction`, `NewTransaction`

## Utils (`utils/`)
- `formatAmount.ts` — `formatAmount(value)` → USD currency string (`Intl.NumberFormat`)

## Theme tokens (`styles/theme.css`)
Default Tailwind palette is disabled. Available color tokens (use as `bg-*`, `text-*`, `border-*`, `ring-*`, ...):

| Group | Tokens |
| --- | --- |
| Brand | `primary`, `primary-hover`, `primary-soft`, `on-primary` |
| Status | `success`, `success-soft`, `danger`, `danger-hover`, `danger-soft`, `warning`, `warning-soft` |
| Surfaces | `background` (page), `surface` (cards), `border` |
| Text | `content`, `content-muted` |
