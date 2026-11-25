# Architecture map

Keep this file in sync with the code. It should let an agent understand the project without opening every file.

## Repo layout
- Git remote: `origin` → `https://github.com/n1ma17/VERO.git` (branch `master`). One repo for the whole project; do not add nested `.git` under `front-end/` or `back-end/`.
- `front-end/` — Vue SPA. Talks to Nest over HTTP (`VITE_API_URL`, default `http://localhost:3000`). View-month UI state stays in `localStorage`.
- `back-end/` — NestJS 12 API (Express). PostgreSQL via `pg` pool, Better Auth, Arcjet.
- `database/` — PostgreSQL schema (`sql/001_calendar.sql` … `009_companies.sql`, `scripts/apply.sh`). Multi-currency views in `007`; Gregorian ledger in `008`; companies in `009` (recreates `v_installments` + ledger views). Local database `app_money` on PostgreSQL 18 (`127.0.0.1:5432`). Cluster data directory is `F:\database`; do not put project SQL there.
- Docker (repo root): `docker-compose.yml` runs `db` (Postgres 18), `backend` (Nest), `frontend` (nginx SPA + `/api` reverse proxy). Dockerfiles: `back-end/Dockerfile`, `front-end/Dockerfile` + `front-end/nginx.conf`. Root `.env.example` → copy to `.env`. Default UI `http://localhost:8080`; host Postgres publish `5433` (avoids local 5432 clash). Backend entrypoint runs `scripts/migrate.ts` then `node dist/main.js`. Image build context is the repo root (`.dockerignore`).
- `.agent/` — agent memory (this file, `remember.md`, `review.md`). Canonical copy at repo root.
- `AGENTS.md` — mandatory start/end-of-task workflow. Vue rules: `front-end/AGENTS.md`. Nest rules: `back-end/AGENTS.md`.

## Database (`app_money`)
Multi-currency (`007_multi_currency.sql`): `bills` / `bank_deposits` / `expenses` store `amount money_amount` (`numeric(20,2) > 0`) **in the row's own `currency`** (`USD`|`EUR`|`GBP`|`IRR`); legacy Toman rows became IRR ×10. `users.currency` = display currency, `users.irr_per_usd` = optional manual free-market rate. `fx_rates(currency, per_usd, source, fetched_at)` = units per 1 USD; `v_user_fx(user_id, currency, per_usd)` applies the manual IRR override. Views expose `amount` + `currency` + `amount_usd`; `v_month_totals` and `v_ledger_entries.balance_usd` are **USD**. Each money row has `user_id`. Auth tables use Better Auth camelCase; money tables stay snake_case.

| Object | Role |
| --- | --- |
| `users`, `sessions`, `accounts`, `verifications` | Better Auth identity (plural names, `usePlural: true`) |
| `bills` | Gregorian `DATE` span: `start_on`, `end_on`, `due_day` 1–31. Duration is derived (Jalali months between start and end). Optional `company_id` (null = Others). |
| `companies` / `company_logos` | Per-user bill payees (name + optional logo ≤128 KB). Migration `009_companies.sql` moves legacy `bill_logos` into companies. |
| `installment_payments` | PK `(bill_id, due_on DATE)` plus `paid_at` |
| `bank_deposits` | `arrived_on`, `booked_on` (`booked_on` is Jalali day 1 of the booked month, as Gregorian DATE) |
| `expenses` | Purchase, category enum, `occurred_on` DATE |
| `v_installments` | Expanded bill months. Id `billId__YYYY-MM-DD` (Gregorian due date). Status paid / unpaid / overdue |
| `v_month_totals` | Income, bills, expenses, net, cumulative balance — grouped by Jalali year/month of the stored DATE |
| `v_ledger_entries` | Statement lines with running balance |

Storage and API dates are Gregorian ISO `YYYY-MM-DD`. Jalali ledger views group by `date_to_jalali` (matches `jalaali-js` 2.0.1); Gregorian ledger views (`*_g`) group by `EXTRACT(YEAR/MONTH FROM …)`. Overdue uses the date in `Asia/Tehran`. Bill installments still expand by Jalali months in `v_installments`. Paid installments hit the ledger and balance only when paid, grouped by payment month (Asia/Tehran), not by due month.

## Backend stack (`back-end/`)
- NestJS 12, Express, `bodyParser: false` (Better Auth reads raw bodies)
- Global prefix `api` except `GET /`
- `@thallesp/nestjs-better-auth` + `kyselyAdapter` on the shared `pg.Pool` (`usePlural: true`)
- Arcjet Shield + fixed window (120/min; `ARCJET_MODE=DRY_RUN` locally)
- Feature modules in `src/module/`: `users`, `currency`, `companies`, `bills`, `deposits`, `expenses`, `installments`, `ledger`, `dashboard`, `wallet`
- Infra in `src/lib/`: `database` (`PgModule`), `fx` (global `FxService`), `auth`, `arcjet`
- `src/common/money/currency.ts` — `CURRENCIES`, `roundMoney` (IRR 0 dp, others 2), `fromUsd`. `FxService` refreshes `fx_rates` when older than 6h from `open.er-api.com`, falling back to jsDelivr `fawazahmed0/currency-api` (20s timeout, 10 min retry backoff, refresh on bootstrap). Requests only wait on refresh while rates are still seed rows.
- Save DTOs: `amount` `@IsNumber({maxDecimalPlaces:2}) @Min(0.01)` + required `currency`; services `roundMoney` before insert. Row DTOs return amount as entered + `currency`. `LedgerService` converts USD view figures to the user's display currency (`LedgerMonthDto.currency`; entries carry `originalAmount`/`originalCurrency`).
- Scripts: `npm run db:migrate` (applies `database/sql`), `npm run db:seed` (admin user + default wallet from repo-root `money-management-backup-2026-10-26.xlsx`, override with `ADMIN_BACKUP_XLSX`), `npm run db:reset-admin-password` (restores `ADMIN_PASSWORD` without re-importing the wallet)
- Auth email: `EMAIL_PROVIDER=log` (Nest console) or `smtp` (`SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`). Forgot password generates a 12-character password, emails it, then updates `accounts.password`.

### HTTP (session cookie required except `GET /` and `/api/auth/*`)
| Method | Path | Role |
| --- | --- | --- |
| POST/GET | `/api/auth/*` | Better Auth (sign-up, sign-in, sign-out, session, request-password-reset) |
| GET/PATCH | `/api/users/me` | Profile (vin-style; name + username only on PATCH) |
| GET/PATCH | `/api/currency` | `{currency, rates (effective per USD), marketRates, irrPerUsd, source, fetchedAt}`; PATCH `{currency?, irrPerUsd?: number\|null}` |
| GET | `/api/users/:id` | Own profile only |
| GET/POST/PATCH/DELETE | `/api/companies`, `/api/companies/:id` | Company catalog (name + optional `logoUrl`). DELETE nulls `bills.company_id` |
| GET | `/api/companies/:id/logo` | Company logo bytes |
| GET/POST/PATCH/DELETE | `/api/bills`, `/api/bills/:id` | Bill CRUD; optional `companyId` (null = Others). DELETE cascades installment payments (all months) |
| GET/POST/PATCH/DELETE | `/api/deposits` | Bank deposits |
| GET/POST/PATCH/DELETE | `/api/expenses` | Expenses |
| GET/PATCH | `/api/installments`, `/api/installments/:id/paid` | View rows + set `paid_at` |
| GET | `/api/ledger?date=` | Month statement from views. `date` is Gregorian ISO of day 1 of the viewed month. IRR users use Jalali views (`v_month_totals` / `v_ledger_entries`); other currencies use Gregorian views (`v_month_totals_g` / `v_ledger_entries_g` from `008_gregorian_ledger.sql`) |
| GET | `/api/dashboard` | Current-month collections |
| PUT | `/api/wallet` | Replace all collections from an Excel backup (optional `companies[]`; legacy bill-keyed `logos` still accepted) |

## Frontend stack
- Vue 3.5 (`<script setup lang="ts">`), TypeScript 6, Vite 8 on port 5173
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS)
- Vue Router 5 (`createWebHashHistory` + Vite `base: './'` for Capacitor/`file`/`http` WebView)
- Capacitor 8 Android (`front-end/capacitor.config.ts`, `webDir: dist`, `androidScheme: http`, WebView `hostname` = host of `VITE_API_URL`, `CapacitorHttp` enabled, cleartext + allowMixedContent). Sync: `npm run cap:sync`. Launcher/splash: `front-end/assets/icon.png` → `npm run assets:android` (`@capacitor/assets` writes `android/.../mipmap-*`).
- Path alias: `@` → `src`
- `better-auth/vue` client (`src/api/authClient.ts`); REST helper `src/api/http.ts` (`credentials: 'include'`, 8s abort). `apiBaseUrl()` (`api/apiBase.ts`): browser → same-origin `/api` (Vite proxy); Capacitor/LAN WebView → `protocol//hostname:3000` (+ optional `VITE_API_URL`), using `globalThis.Capacitor` not `@capacitor/core` import (avoids Rollup DCE).
- On boot / login: `loadCurrency` first, then align view-months to the active calendar, then parallel `GET` of `/api/bills`, `/api/deposits`, `/api/expenses`, `/api/installments`, `/api/companies`, and `/api/ledger?date=` (day 1 of the stored view-month, as Gregorian ISO). Mutations go straight to the Nest API; in-memory composables hold the working set. Dashboard derives from those collections. Transactions uses `GET /api/ledger`. Composables convert ISO ↔ active calendar at the HTTP boundary (`src/utils/moneyApi.ts` via `src/utils/calendar.ts`); UI year/month/day fields are Jalali when display currency is IRR, Gregorian otherwise.
- Excel backup reads the in-memory cache (including Companies + company logos) and `PUT /api/wallet` on import, then reloads collections + ledger.

## Routes
| Path | Name | Page |
| --- | --- | --- |
| `/` | `landing` | `pages/LandingPage.vue` (public; `hideChrome`, `fullBleed`) |
| `/login` | `login` | `pages/AuthPage.vue` (public; `hideChrome`) |
| `/dashboard` | `dashboard` | `pages/DashboardPage.vue` |
| `/transactions` | `transactions` | `pages/TransactionsPage.vue` |
| `/deposits` | `deposits` | `pages/DepositsPage.vue` |
| `/bills` | `bills` | `pages/BillsPage.vue` — list for view month |
| `/bills/entry/:id?` | `bill-entry` | `pages/BillEntryPage.vue` — define/edit bill; `PageBackLink` → list |
| `/installments` | `installments` | `pages/InstallmentsPage.vue` |
| `/installments/:id` | `installment-detail` | `pages/InstallmentDetailPage.vue` |
| `/expenses` | `expenses` | `pages/ExpensesPage.vue` |
| `/expenses/entry`, `/expenses/entry/:id` | `expense-entry` | `pages/ExpenseEntryPage.vue` (optional `id` = edit expense) |
| `/settings` | `settings` | `pages/SettingsPage.vue` — Currency + Theme tabs |

Guest routes (`meta.public`) skip the auth guard. All other routes require a Better Auth session (`ensureAuthReady` then `useAuth`). Unauthenticated visits redirect to `/login?redirect=…`. Logged-in visits to `/login` or `/` go to dashboard. `App.vue` hides navbar + bottom nav when `hideChrome` or logged out; `meta.fullBleed` removes main padding (landing).

## Pages and their components
Unchanged from the Vue UI map: `Landing/`, `Auth/`, `Dashboard/`, `Deposits/`, `Transactions/`, `Expenses/`, `ExpenseEntry/`, `Bills/`, `Installments/`, `InstallmentDetail/`, `components/shared/`. Bills: `BillCompanyPicker` + `BillCompanyManage` on define/edit; cards via `ReceiptBillIdentity` → `CompanyLogoImage`. Installments: `InstallmentCompanyBreakdown` under summary.

Deposits list: `DepositList` (header + empty state) → `DepositWallet` (`.deposit-pocket`: fanned cards above a dark back, SVG front with dashed stitch, centered total + eye toggle; lifted card moves to the top with Edit/Delete) → `DepositCard` (full card `h-52`: note + `AppMoneyMark` accent logo top-right, amount center, dates bottom). `shared/AppMoneyMark.vue` — app chart icon + “money” in `text-secondary`. Hero plate stays `BankCardPlastic` + `BankCardMandala`. `DepositForm` scrolls into view when editing starts.

## Composables (`front-end/src/composables/`)
- `useAuth.ts` — Better Auth email/password (`login` / `register` / `logout` / `requestNewPassword`); session in memory. `ensureAuthReady()` hydrates session then loads collections. Forgot password calls `POST /api/auth/request-password-reset`; the server emails a generated password (SMTP or Nest log) then hashes it onto `accounts`.
- `loadMoneyCollections.ts` — `Promise.all` of `loadCurrency` / `loadBills` / `loadDeposits` / `loadExpenses` / `loadInstallments` / `loadLedger`; `clearMoneyCollections` on logout (memory only).
- `useCurrency.ts` — display currency + rates from `/api/currency` (code cached in localStorage `money-managment:currency`). `convertAmount` (unrounded), `withDisplayAmount(row)`, `roundMoney`, `displayCurrency()`; `setCurrency` / `setIrrMarketRate` PATCH then `bumpMoneyData()`. Crossing IRR ↔ other also reloads collections and resets view-months (`reloadMoneyCollectionsForCalendar`) because the UI calendar flips Jalali ↔ Gregorian. Row stores keep raw rows (`amount` = `originalAmount` in `currency`) and expose computed lists whose `amount` is converted; `get*Snapshot()` stays raw for Excel.
- `utils/calendar.ts` — calendar mode from `displayCurrency() === 'IRR'`; formatters, month grids, ISO ↔ UI date converters used by pickers (`JalaliDatePicker` / `JalaliCalendarPanel` / `JalaliMonthPicker`, still named Jalali but dual-mode) and `moneyApi.ts`.
- `useLedger` only uses a snapshot whose `currency` matches the display currency.
- `useBills.ts` — REST bills; `loadBills` from `GET /api/bills`. Optional `companyId`. View-month in `localStorage` (`money-managment:bills-view-month`); new bills default to that Jalali month; POST sends `startOn`/`endOn` ISO.
- `useCompanies.ts` / `useCompanyLogos.ts` — company catalog + logo blob cache (`GET /api/companies/:id/logo`). Bill form uses `BillCompanyPicker` + `BillCompanyManage`; cards use `CompanyLogoImage` (`logoKey` = company id when that company has a logo).
- `InstallmentCompanyBreakdown.vue` — SVG column chart by company (60%) + Paid / Unpaid / Overdue (40%).
- `useBankDeposits.ts` / `useExpenses.ts` — `loadDeposits` / `loadExpenses` plus REST CRUD; view-month in `localStorage`.
- `useInstallments.ts` — `loadInstallments` from `v_installments`; `setPaid` → `PATCH /api/installments/:id/paid`.
- `useLedger.ts` — `GET /api/ledger?date=` (Jalali month-first as ISO) for the Transactions statement. View-month stays in `localStorage`; switching months refetches.
- `useDashboard.ts` — still derived on the client from the hydrated collections.
- Other UI composables (`useToast`, printer flows, etc.) unchanged.
- `useLoadingOverlay.ts` + `AppLoadingOverlay.vue` — full-screen centered LOADING + segmented progress bar + Please Wait (`main.css` `.loading-screen*`); ref-counted via `api()` and Better Auth fetch, plus route changes (except `meta.skipLoadingOverlay` printer routes). Use `runWithLoading()` for ad-hoc waits.

## Types / utils
Same Vue types as before (`bill.ts`, `expense.ts`, `installment.ts`, `ledger.ts`, `bankDeposit.ts`) — Jalali ints for pickers; money rows add `originalAmount` + `currency` (`types/currency.ts`: `CURRENCIES`, `CURRENCY_META`, `MoneyRow`). `utils/formatMoney.ts` (`formatMoney` symbol/IRR suffix, `formatMoneyNumber`, `formatMoneyCompact`, `currencyUnit`; default = display currency, rounds first). `utils/formatMoneyInput.ts` + `shared/MoneyAmountInput.vue` (`currency` prop, decimals for USD/EUR/GBP). Forms: new rows use display currency; edits keep the row's original currency + amount. Currency + IRR rate UI on `SettingsPage` (`SettingsCurrencyPanel`). Excel backup format 2 adds `currency`; format 1 files are Toman → IRR ×10 (front `appBackupExcel.ts` + back `scripts/lib/backup-xlsx.ts`). API DTOs use ISO dates (`startOn`/`endOn`, `occurredOn`, `arrivedOn`/`bookedOn`, installment `dueDate`). Excel backup still stores Jalali numbers for humans; convert on import/`PUT /api/wallet`.

## Theme tokens (`styles/theme.css` + `app-theme-overrides.css`)
Default **Black Box**: `background` `#19191B`, `text` `#8C8E92`, `accent` `#FF5410`. User themes (Settings): **Cherry Noir**, **Nature Perfume**, **Desert**, **Ocean**, **Light** — each 60/30-ish/10 on `html[data-theme]`. Exception: `stamp-approved` `#A8DFC4` pastel green for Approved / auth success stamps on receipts only; `status-*` pastels for installment badges; `deposit-card-{sky,mint,peach,lilac,rose}` pastels + `deposit-folder` / `deposit-folder-front` for the deposits wallet. Every other token aliases one of them: `surface`/`black`/`foreground`/`on-accent`/`on-paper` = background; `primary`/`secondary`/`text-muted`/`white`/`success`/`warning`/`paper`/`printer` = text; `danger` = accent. Fonts: `font-display` Archivo Variable (h1/h2 via base layer, big numbers), `font-sans` IBM Plex Sans (`font-mono` aliases it). Fonts are bundled with `@fontsource` and imported in `main.ts`. `shadow-*` utilities are redefined as 1px hairline outlines; `blur-*`/`drop-shadow-*` are cleared; the `rounded-*` scale tops out at 4px.

## Receipt printer (`components/shared/ReceiptPrinter*`)
`ReceiptPrinterRoot` (stage + `pinSlotOpen`) → `ReceiptPrinterMachine` (dark bar: slot, LED, `ReceiptPrinterScreen` + `ReceiptPrinterStatus`) → `ReceiptPrinterOutput` (mouth under the bar; sheet feeds down) → `ReceiptPrinterPaper` (zigzag mask) with `ReceiptPaperHeader` / `ReceiptPaperFooter`. List cards (`receipt-paper--card` on Bills + Installments) use `ReceiptBillIdentity` (optional `CompanyLogoImage` + title). Used by Expense, BillDefinition, Installment printers, plus AuthTicketPrinter (pinned, no tear-off).

## Landing (`components/Landing/`)
`LandingScreen` (max-w-6xl; every section is its own `grid-cols-12 gap-x-6`) → `LandingBrand`, `LandingPitch` (headline + copy), `LandingContinueButton` (the only button), `LandingProductPreview` (static dashboard header + `LandingPreviewBalance` + `LandingPreviewStatement`, sample Aban 1405 data), `LandingFeatures`, `LandingFooter`.
