# Remember

Long-term memory for the agent. Read at the start of every task, update at the end.

## User preferences
- The user may write in Persian (Finglish) in chat; **app UI stays English**. Reply in the user's language; code, comments, and memory files stay in English.
- Strict component-based architecture: no logic in pages, every component owns its logic.
- Every page has a matching folder in `components/` with the same name.
- Tailwind for all styling; all colors from `src/styles/theme.css`.
- Agent must use the `.agent/` memory (architect / remember / review) instead of re-reading everything.

## Decisions
- Visual theme matches the user’s loan-app reference: dark slate green page (`background`), sage header (`background-elevated`), white cards (`surface`), peach highlight (`accent`). Card copy uses `content-on-surface*` tokens; page chrome uses `content` / `content-muted`.
- Tailwind v4 CSS-first config: theme is defined with `@theme` in `theme.css`; there is no `tailwind.config.js`.
- `--color-*: initial` in `theme.css` removes the default palette so only theme colors can be used.
- Page files are named `<Name>Page.vue`; their component folder is `components/<Name>/` (without the `Page` suffix).
- Shared reactive state lives in composables as module-level refs (simple singleton store). No Pinia yet — add it only if state grows complex.
- Data is stored in `localStorage` until a backend exists.
- Installment status is never stored: `overdue` is derived from `dueDate` + `paidAt`. Only `paidAt` is persisted.
- Installments list is read-only; status is changed only on the detail page (user requirement).
- Paying happens through the receipt printer on the detail page: the printer prints first, then the installment is marked paid and the left card updates.
- When porting React components the user provides: React context → provide/inject composable, `motion` → Tailwind keyframes + `<Transition>`, icon libs → inline SVG, foreign color tokens → new `theme.css` tokens, texture images dropped.
- Receipt look: white card, colored status strip on top, notched dashed dividers, scalloped bottom, monospace values, "APPROVED" stamp on paid ones. Keep the stamp off data rows (on detail it has its own row).

- Ledger balance = all deposits (by counted month) minus all bill installments (by due month, paid or not) minus all expenses (by purchase month); cumulative, can be negative.
- Color language: deposits = success (green), bills = danger (red), expenses = warning (amber).
- Printer pages share `createPrinterFlow` (`usePrinterFlow.ts`); editing reuses the entry page with an optional `:id` route param.
- Charts are hand-written SVG with `fill-*`/`stroke-*` theme classes; no chart library. Dynamic sizes go in SVG attributes, never inline `style`.

## Gotchas
- Tailwind cannot see dynamically built class names; use lookup objects with full class strings.
- `bg-white`, `text-black`, `bg-gray-*` etc. do not exist (palette disabled). Use `bg-surface`, `text-content`, ...

## Task log
<!-- Newest first. Format: - YYYY-MM-DD — summary (files touched) -->
- 2026-10-24 — Git remote `origin` → https://github.com/n1ma17/VERO.git; pushed `master` (commit c53b942).
- 2026-10-24 — Bottom nav: horizontal `--nav-pad-x` on track so edge tabs clear rounded corners; active icon absolutely centered in raised circle (`main.css`).
- 2026-10-24 — Bottom nav: scooped notch + gap under the raised circle (mask on the pill, not a ring on the circle); pill max-width 320px (`main.css`, `AppBottomNav` `data-index`).
- 2026-10-24 — Replaced header page links with a fixed curved bottom nav (`AppBottomNav`, `AppNavIcon`, `appNav.ts`, `.app-bottom-nav*` in `main.css`). Header is title + Jalali date. Active tab: raised `danger` circle on the pill. Nested routes stay highlighted.
- 2026-10-24 — Dashboard Excel backup: export/import all app data (`DashboardDataBackup`, `appBackupExcel`, `appDataKeys`, `xlsx` dep).
- 2026-10-24 — Save/pay on printer pages: smooth scroll to `#receipt-printer` before processing (`scrollToReceiptPrinter`, `usePrinterFlow`, `InstallmentPrinter`).
- 2026-10-24 — Expense categories: beauty, car, motorcycle (`types/expense`, `expenseCategories`, theme `chart-9`..`chart-11`).
- 2026-10-24 — Expenses feature: entry page with printer (`/expenses/entry/:id?`, `ExpenseEntry/*`), list page (`/expenses`, `Expenses/*`), `useExpenses`, `useExpenseEntryFlow`, `types/expense`, `utils/expenseCategories`. Expenses feed `utils/ledger`, `useLedger` + Transactions components, `useDashboard` (new `SpendingBreakdown`, `RecentActivity`; deleted `BillBreakdown`, `RecentDeposits`). Moved printer primitives + `TomanAmountInput` to `shared/`; `createPrinterFlow` factory. Tokens `chart-6`..`chart-8`. Verified in browser.
- 2026-10-24 — Dashboard redesigned (hero + KPIs + cash-flow chart + upcoming bills + donut + deposit timeline) on `useDashboard`. Extracted `utils/ledger.ts`, `utils/chart.ts`. Deleted legacy USD code (`useTransactions`, `TransactionItem`, `formatAmount`, `types/transaction`, old Dashboard cards). New tokens `chart-*`, `danger-on-dark`; `animate-fade-up`.
- 2026-10-24 — Transactions page rebuilt as ledger (`useLedger`, 5 `Ledger*` components, SVG chart). Deleted `TransactionForm`/`TransactionList`. Deposits got `bookedYear/Month` (counted month) + month navigator.
- 2026-10-24 — Deposits: Jalali deposit date on add/edit; list shows `formatJalaliDate`; filtered by date’s month.
- 2026-10-24 — Deposits: edit deposit via form (`startEditingDeposit`, `updateDeposit`).
- 2026-10-24 — Deposits page `/deposits`: bank card UI, Toman deposits for current Jalali month, total balance = sum of all deposits (`useBankDeposits`).
- 2026-10-24 — Fixed Jalali calendar clipped at viewport bottom: flip above + max-height from available space (`JalaliDatePicker.vue`).
- 2026-10-24 — Bills: 2-col printer on save (3s reset); `/bills/:id` edit; detail page "Edit bill". `useBillDefinitionFlow`, `updateBill`.
- 2026-10-24 — Bills page: define-only (removed month list, navigator, copy-from-previous); success toast on save (`useToast`, `AppToastHost`); slimmed `useBills`. Deleted `BillMonth*`, `BillTransferBar`, `BillReceiptRow`.
- 2026-10-24 — Installments are derived from bills (not a separate list); paid state in `installment-payments` localStorage. Logos in IndexedDB (`bill-logos`), bill JSON in localStorage without image data. Logo max 128 KB.
- 2026-10-24 — Bills: optional `logoUrl` (image upload, data URL, max 256 KB); `BillLogoUpload.vue`, `readImageFile.ts`.
- 2026-10-24 — Bills: `dueDay` per bill, full Jalali date picker UI, due/overdue on list rows.
- 2026-10-24 — Bills page `/bills`: Jalali monthly storage, 1–60 month span, transfer from previous month, receipt form + themed Jalali picker, Toman formatting. Dep: `jalaali-js`.
- 2026-10-24 — Smooth animated receipt card update on pay (status strip, badge, paid-on row, stamp expand, celebrate glow); `animate-receipt-celebrate` in `main.css`.
- 2026-10-24 — Detail page: 2-column layout, ported user's React `ReceiptPrinter` to Vue (6 primitives + `useReceiptPrinter`), `InstallmentPrinter` pay flow, printer tokens in `theme.css`, `animate-receipt-feed` in `main.css`, AGENTS.md animation rule. Verified in browser. Build passes.
- 2026-10-24 — Added Installments list + InstallmentDetail pages (receipt design, approved stamp, mark paid/unpaid on detail only), `useInstallments`, `useCurrentInstallment`, date/status utils, 4 shared receipt components, navbar link. Verified in browser. Build passes.
- 2026-10-24 — Re-themed to loan-app palette in `theme.css`; updated navbar, cards, buttons, summary cards, forms, transaction rows for dark shell + light cards. Build passes.
- 2026-10-24 — Initial setup: Vite + Vue 3 + TS, Tailwind v4, Vue Router, theme file, Dashboard + Transactions example pages, `AGENTS.md`, `.agent/` memory. Build passes.
