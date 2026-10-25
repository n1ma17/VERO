# Architecture map

Keep this file in sync with the code. It should let an agent understand the project without opening every file.

## Stack
- Vue 3.5 (`<script setup lang="ts">`), TypeScript 6, Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS)
- Vue Router 5 (`createWebHistory`, lazy-loaded pages)
- Path alias: `@` → `src` (set in `vite.config.ts` and `tsconfig.app.json`)
- Persistence: `localStorage` + IndexedDB bill logos (no backend yet). Excel backup via `xlsx` (lazy-loaded on dashboard chunk).

## Routes
| Path | Name | Page |
| --- | --- | --- |
| `/` | `dashboard` | `pages/DashboardPage.vue` |
| `/transactions` | `transactions` | `pages/TransactionsPage.vue` |
| `/deposits` | `deposits` | `pages/DepositsPage.vue` |
| `/bills`, `/bills/:id` | `bills` | `pages/BillsPage.vue` (optional `id` = edit bill) |
| `/installments` | `installments` | `pages/InstallmentsPage.vue` |
| `/installments/:id` | `installment-detail` | `pages/InstallmentDetailPage.vue` |
| `/expenses` | `expenses` | `pages/ExpensesPage.vue` |
| `/expenses/entry`, `/expenses/entry/:id` | `expense-entry` | `pages/ExpenseEntryPage.vue` (optional `id` = edit expense) |

## Pages and their components
### DashboardPage → `components/Dashboard/`
Current Jalali month overview, all from `useDashboard()`. No `PageHeader` (hero replaces it). Sections use `animate-fade-up` with staggered `[animation-delay:…]`.
- `DashboardHero.vue` — dark gradient hero: Jalali date + greeting, remaining balance (red-on-dark when negative), net pill, quick actions, 6-month balance sparkline, month-progress bar
- `DashboardKpis.vue` — 3+2 grid: deposits, bills, expenses (links to `/expenses`), bills-paid ring, overdue (red alert card, links to installments)
- `CashFlowChart.vue` — 12-month smooth area chart (deposits vs bills vs expenses), hover tooltip, avg deposits / avg spending / best-month strip
- `UpcomingBills.vue` — next 5 unpaid installments with logo/initial, days-left badge, links to detail
- `SpendingBreakdown.vue` — "Where money goes" donut: one slice per expense category + one "Bills & installments" slice (danger)
- `RecentActivity.vue` — timeline of last 6 deposits + expenses (expenses link to edit)
- `DashboardDataBackup.vue` — Export / Import Excel (`appBackupExcel.ts`): bills, deposits, expenses, installment payments, bill logos (chunked in `LogoChunks` sheet)

### DepositsPage → `components/Deposits/`
Bank deposits in Toman for the **current Jalali month**; total balance = sum of all deposits.
- `BankBalanceCard.vue` — `bank-balance-backdrop`: large balance + small unit (like reference $), then 3D card
- `BankCardPlastic.vue` — two-tone card (`primary` top / `bank-card-to` bottom), corner mandalas, `money` + VISA only, 3D tilt
- `DepositForm.vue` — amount (Toman) + optional note → `addDeposit`
- `DepositList.vue` — current month’s deposits, remove row

### TransactionsPage → `components/Transactions/`
Monthly ledger (Toman, Jalali) built from deposits (income, by `booked` month), bill installments (by due month) and expenses (by purchase month). All read `useLedger()`.
- `LedgerSummaryCards.vue` — 3+2 grid: deposits, bills (paid/open), expenses, net, remaining balance (red card when negative)
- `LedgerChart.vue` — SVG chart, last 6 months: deposit/bill/expense bars + cumulative balance line; nice round ticks incl. 0; hover shows values, click opens month
- `LedgerCoverage.vue` — "Spending coverage": % of deposits used by bills + expenses (stacked SVG bar)
- `LedgerTable.vue` — statement: carried-in row, entries with running balance, filter All/Deposits/Bills/Expenses; bill rows link to installment detail, expense rows to `expense-entry`

### ExpensesPage → `components/Expenses/` (list, like Installments)
- `ExpenseSummary.vue` — month total + count, per-category bars with share %
- `ExpenseList.vue` — grid of cards for the view month (newest first) + empty state
- `ExpenseReceiptCard.vue` — receipt-style card (category strip, tile, date, note, amount); `RouterLink` to `expense-entry` edit

### ExpenseEntryPage → `components/ExpenseEntry/`
2-column on `lg` like Bills: left form, right printer. `/expenses/entry/:id` pre-fills for edit.
- `ExpenseEntryForm.vue` — title, amount, category chips, purchase date (Jalali), note; add/update → `useExpenseEntryFlow().startIssue`; edit mode has two-step delete; after reset navigates to `/expenses` when editing
- `ExpensePrinter.vue` — printer + receipt paper for the saved expense

### BillsPage → `components/Bills/`
2-column on `lg` (like installment detail): left definition form, right receipt printer. Route `/bills/:id?` pre-fills form for edit.
- `BillDefinitionReceipt.vue` — form; `addBill` / `updateBill`; triggers `useBillDefinitionFlow().startIssue`
- `BillDefinitionPrinter.vue` — issue animation (processing → printing → complete); after 3s resets form + printer (navigates to `/bills` if was editing)
- `BillLogoUpload.vue` — used by definition form

### InstallmentsPage → `components/Installments/` (read-only list)
- `InstallmentSummary.vue` — paid / unpaid / overdue counts
- `InstallmentList.vue` — grid of receipt cards, sorted by due date
- `InstallmentReceiptCard.vue` — receipt-style card (status strip, perforated divider, scalloped edge, stamp if paid); whole card is a `RouterLink` to `installment-detail`

### InstallmentDetailPage → `components/InstallmentDetail/`
Layout: back link on top; 2-column grid on `lg` — left: receipt card + actions, right: printer.
- `BackToInstallments.vue` — back link
- `InstallmentReceipt.vue` — left card: full receipt (rows, total, stamp row if paid, barcode); "not found" fallback
- `ReceiptBarcode.vue` — decorative barcode; prop `code`
- `InstallmentStatusActions.vue` — "Edit bill" → `/bills/:billId`; "Mark as unpaid" when paid, otherwise hint to use printer
- `InstallmentPrinter.vue` — right side; owns printer `stage`. Pay button → `processing` (1.2s) → `printing` (1.8s) → `complete` + `setPaid(id, true)`. Already-paid installments start at `complete`; stage resets when id/paidAt changes.
## Shared components (`components/shared/`)
- `AppNavbar.vue` — slim top bar: app title + Jalali date (no page links)
- `AppBottomNav.vue` — pill bottom bar + sliding light/beam; 6 tabs (`appNav.ts`, `AppNavIcon`); styles `.app-bottom-nav*` in `main.css`
- `AppToastHost.vue` — global success toasts via `useToast()` (Teleport to body)
- `PageHeader.vue` — props `title`, `subtitle?`
- `JalaliMonthNavigatorBar.vue` — UI: Previous / caption / Jalali month / Next (+ optional back link)
- `ViewMonthNavigator.vue` — prop `context`: `expenses` | `installments` | `deposits` | `ledger`; wires the right composable
- `BaseCard.vue` — surface container; prop `title?`, default slot
- `BaseButton.vue` — props `variant: primary|danger|ghost`, `type: button|submit`
- `ApprovedStamp.vue` — rotated double-border "APPROVED" stamp; props `paidAt?`, `size: sm|lg`
- `InstallmentStatusBadge.vue` — pill with dot; prop `status`
- `ReceiptDivider.vue` — dashed line with side notches (notches use `bg-background`, parent needs `overflow-hidden`)
- `ReceiptEdge.vue` — scalloped bottom edge; prop `teeth` (default 16); parent needs `relative overflow-hidden` + bottom padding
- `JalaliDatePicker.vue` — popover full Jalali date picker; props `year`, `month`, `day`, `label?`, `disabled?`. Popover is teleported, measures its height and flips above the trigger when there is not enough space below; min width 320px
- `JalaliCalendarPanel.vue` — themed month grid + weekday day grid + year controls
- `JalaliMonthPicker.vue` — month-only picker
- `TomanAmountInput.vue` — grouped-digits Toman input (bills, deposits, expenses)
- Receipt printer primitives (Vue port of a React/motion component; share `stage` via provide/inject), used by bills, installment detail, expense entry:
  - `ReceiptPrinterRoot.vue` — prop `stage`, provides context
  - `ReceiptPrinterMachine.vue` — device body + paper slot
  - `ReceiptPrinterScreen.vue` — dark screen container
  - `ReceiptPrinterStatus.vue` — icon + label per stage with `<Transition>`; prop `labels?`
  - `ReceiptPrinterOutput.vue` — clips the paper; `printing` uses `animate-receipt-feed`
  - `ReceiptPrinterPaper.vue` — white paper with `ReceiptEdge` bottom

## Composables (`composables/`)
- `useDashboard.ts` — current-month overview (no state of its own): balance, net, savings rate, KPI counts, overdue, `upcomingBills`, `cashFlow` (12 mo), `balanceTrend` (6 mo), `spendingBreakdown`, `recentActivity`. Net = deposits − bills − expenses.
- `useInstallments.ts` — **computed from bills** via `buildInstallmentsFromBills`; payment flags in `money-managment:installment-payments` (`billId:YYYY-MM` → paidAt ISO). Returns `installments`, `setPaid(id, paid)` where `id` is `encodeInstallmentId`.
- `useBillLogos.ts` — in-memory cache + `persistBillLogo` / `loadBillLogo` (IndexedDB).
- `useCurrentInstallment.ts` — reads `route.params.id`; returns `installment`, `status`, `setPaid`.
- `useReceiptPrinter.ts` — `provideReceiptPrinter(stage)` / `useReceiptPrinter(componentName)` (inject, throws outside Root).
- `useToast.ts` — module-level toast queue; `showSuccess(text)`, `dismiss(id)`.
- `usePrinterFlow.ts` — `createPrinterFlow<Snapshot>()` factory: singleton save → print → reset flow (`stage`, `snapshot`, `formResetTick`, `startIssue`, `cancelFlow`); `PRINTER_RESET_MS` = 3s.
- `useBillDefinitionFlow.ts` — `BillReceiptSnapshot` + `createPrinterFlow` instance for bills.
- `useExpenseEntryFlow.ts` — `ExpenseReceiptSnapshot` + `createPrinterFlow` instance for expenses.
- `useExpenses.ts` — `money-managment:expenses` (+ `expenses-view-month`). Returns `expenses`, view-month nav, `expensesInViewMonth`, `monthTotal`, `categoryTotals`, `getExpenseById`, `addExpense`, `updateExpense`, `removeExpense`.
- `useBills.ts` — `localStorage` key `money-managment:bills`. Returns `bills`, `getBillById`, `addBill`, `updateBill`.
- `useBankDeposits.ts` — `money-managment:bank-deposits` (+ `deposits-view-month`). Deposit has bank date (`jalaliYear/Month/Day`) and counted month (`bookedYear/Month`). Returns `totalBalance`, `monthTotal`, `currentMonthTotal`, `depositsInViewMonth`, view-month nav, add/update/remove + editing state.
- `useLedger.ts` — `money-managment:transactions-view-month`. Combines deposits + `allInstallments` + expenses; returns month totals (`monthIncome/Bills/Expenses/Spending/Net`), `openingBalance`, `closingBalance` (cumulative, may be negative), `entries` with running balance, `chartSeries` (6 months), nav helpers.

## Types (`types/`)
- `receiptPrinter.ts` — `ReceiptPrinterStage = 'idle' | 'processing' | 'printing' | 'complete'`
- `bill.ts` — `JalaliMonth`, `Bill` (includes `dueDay`), `NewBill`
- `installment.ts` — `Installment` from a bill month occurrence: `billId`, Jalali `dueYear/Month/Day`, `dueDate` (Gregorian for status), `logoKey`, `paidAt`
- `bankDeposit.ts` — `BankDeposit`, `NewBankDeposit`
- `ledger.ts` — `LedgerEntry` (`expenseId`, `category` for expenses), `LedgerEntryKind` (`deposit|bill|expense`), `LedgerMonthPoint`
- `expense.ts` — `ExpenseCategory` (food, groceries, home, clothing, entertainment, transport, car, motorcycle, beauty, health, other), `Expense`, `NewExpense`

## Utils (`utils/`)
- `formatToman.ts` — `formatToman`, `formatTomanNumber` (no unit), `formatTomanCompact` (chart axes, `12.5M`), deprecated `formatTomanPersian`
- `ledger.ts` — `buildMonthTotals(deposits, installments, expenses)` → `{income, bills, expenses}` per month index, `monthNet`, `balanceThrough(totals, index)`; shared by `useLedger` + `useDashboard`
- `expenseCategories.ts` — `EXPENSE_CATEGORY_ORDER`, `expenseCategories` (label + full class strings `tile`/`dot`/`fill`/`stroke`/`strip`), `isExpenseCategory`
- `chart.ts` — `niceScale` (round ticks incl. 0), `smoothPath` (no-overshoot Catmull-Rom), `areaPath`
- `jalali.ts` — Jalali month math/names, `jalaliToIsoDate`, `isBillActiveInMonth`, … (`jalaali-js`)
- `billInstallments.ts` — `buildInstallmentsFromBills`, `encodeInstallmentId` / `parseInstallmentId`, `installmentPaymentKey`
- `billLogoStore.ts` — IndexedDB `bill-logos` store on device
- `date.ts` — `toIsoDate`, `addDays`, `daysBetween`, `formatDate` (Gregorian; installments)
- `installmentStatus.ts` — `getInstallmentStatus` (paid if `paidAt`, overdue if `dueDate` < today, else unpaid), `installmentStatusLabels`

## Theme tokens (`styles/theme.css`)
Minimal palette (default Tailwind palette disabled). Variants use opacity: `text-text/60`, `bg-success/15`, `border-primary/20`.

| Token | Use |
| --- | --- |
| `background` | Page shell |
| `primary` | Dark brand (header, bottom nav, hero, printer, bank card) |
| `accent` | Highlights / CTAs |
| `success`, `danger`, `warning` | Deposits, bills, expenses + status |
| `text`, `text-muted` | Copy on light `surface` cards |
| `surface` | White cards (structural, not a brand hue) |

On `bg-primary`: `text-background`, `text-background/70`. Charts & expense categories rotate the five brand hues. Bank card 3D: `--bank-card-perspective`, `--bank-card-tilt-*` in `theme.css`.

Animations (`styles/main.css` `@theme`): `animate-receipt-feed` — stepped paper feed, 1.75s; `animate-receipt-celebrate`; `animate-fade-up` — section entrance (use `[animation-delay:…]` to stagger).
