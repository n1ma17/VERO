# Architecture map

Keep this file in sync with the code. It should let an agent understand the project without opening every file.

## Repo layout
- Git remote: `origin` → `https://github.com/n1ma17/VERO.git` (branch `master`). One repo for the whole project; do not add nested `.git` under `front-end/` or `back-end/`.
- `front-end/` — Vue SPA. Talks to Nest over HTTP (`VITE_API_URL`, default `http://localhost:3000`). View-month UI state stays in `localStorage`.
- `back-end/` — NestJS 12 API (Express). PostgreSQL via `pg` pool, Better Auth, Arcjet.
- `database/` — PostgreSQL schema (`sql/001_calendar.sql`, `002_tables.sql`, `002a_gregorian_dates.sql`, `003_views.sql`, `004_better_auth.sql`, `scripts/apply.sh`). Local database `app_money` on PostgreSQL 18 (`127.0.0.1:5432`). Cluster data directory is `F:\database`; do not put project SQL there.
- `.agent/` — agent memory (this file, `remember.md`, `review.md`). Canonical copy at repo root.
- `AGENTS.md` — mandatory start/end-of-task workflow. Vue rules: `front-end/AGENTS.md`. Nest rules: `back-end/AGENTS.md`.

## Database (`app_money`)
Amounts are integer Toman. Each money row has `user_id`. Auth tables use Better Auth camelCase; money tables stay snake_case.

| Object | Role |
| --- | --- |
| `users`, `sessions`, `accounts`, `verifications` | Better Auth identity (plural names, `usePlural: true`) |
| `bills` | Gregorian `DATE` span: `start_on`, `end_on`, `due_day` 1–31. Duration is derived (Jalali months between start and end). |
| `bill_logos` | Optional image, max 128 KB (API: JPEG/PNG/WebP/GIF only) |
| `installment_payments` | PK `(bill_id, due_on DATE)` plus `paid_at` |
| `bank_deposits` | `arrived_on`, `booked_on` (`booked_on` is Jalali day 1 of the booked month, as Gregorian DATE) |
| `expenses` | Purchase, category enum, `occurred_on` DATE |
| `v_installments` | Expanded bill months. Id `billId__YYYY-MM-DD` (Gregorian due date). Status paid / unpaid / overdue |
| `v_month_totals` | Income, bills, expenses, net, cumulative balance — grouped by Jalali year/month of the stored DATE |
| `v_ledger_entries` | Statement lines with running balance |

Storage and API dates are Gregorian ISO `YYYY-MM-DD`. Views still group by Jalali month via `date_to_jalali` (matches `jalaali-js` 2.0.1). Overdue uses the date in `Asia/Tehran`. Bill installments hit the ledger and balance only when paid, grouped by payment month (Asia/Tehran), not by due month.

## Backend stack (`back-end/`)
- NestJS 12, Express, `bodyParser: false` (Better Auth reads raw bodies)
- Global prefix `api` except `GET /`
- `@thallesp/nestjs-better-auth` + `kyselyAdapter` on the shared `pg.Pool` (`usePlural: true`)
- Arcjet Shield + fixed window (120/min; `ARCJET_MODE=DRY_RUN` locally)
- Feature modules in `src/module/`: `users`, `bills`, `deposits`, `expenses`, `installments`, `ledger`, `dashboard`, `wallet`
- Infra in `src/lib/`: `database` (`PgModule`), `auth`, `arcjet`
- Scripts: `npm run db:migrate` (applies `database/sql`), `npm run db:seed` (admin user + default wallet from repo-root `money-management-backup-2026-10-26.xlsx`, override with `ADMIN_BACKUP_XLSX`), `npm run db:reset-admin-password` (restores `ADMIN_PASSWORD` without re-importing the wallet)
- Auth email: `EMAIL_PROVIDER=log` (Nest console) or `smtp` (`SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`). Forgot password generates a 12-character password, emails it, then updates `accounts.password`.

### HTTP (session cookie required except `GET /` and `/api/auth/*`)
| Method | Path | Role |
| --- | --- | --- |
| POST/GET | `/api/auth/*` | Better Auth (sign-up, sign-in, sign-out, session, request-password-reset) |
| GET/PATCH | `/api/users/me` | Profile (vin-style; name + username only on PATCH) |
| GET | `/api/users/:id` | Own profile only |
| GET/POST/PATCH/DELETE | `/api/bills`, `/api/bills/:id` | Bill CRUD; `logoUrl` data URL on write. DELETE cascades logos + installment payments (all months) |
| GET | `/api/bills/:id/logo` | Logo bytes |
| GET/POST/PATCH/DELETE | `/api/deposits` | Bank deposits |
| GET/POST/PATCH/DELETE | `/api/expenses` | Expenses |
| GET/PATCH | `/api/installments`, `/api/installments/:id/paid` | View rows + set `paid_at` |
| GET | `/api/ledger?date=` | Month statement from views. `date` is Gregorian ISO of Jalali day 1 of the viewed month (totals, entries, 6-month chart) |
| GET | `/api/dashboard` | Current-month collections |
| PUT | `/api/wallet` | Replace all collections from an Excel backup |

## Frontend stack
- Vue 3.5 (`<script setup lang="ts">`), TypeScript 6, Vite 8 on port 5173
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS)
- Vue Router 5 (`createWebHistory`, lazy-loaded pages)
- Path alias: `@` → `src`
- `better-auth/vue` client (`src/api/authClient.ts`); REST helper `src/api/http.ts` (`credentials: 'include'`, 8s abort)
- On boot / login: parallel `GET` of `/api/bills`, `/api/deposits`, `/api/expenses`, `/api/installments`, and `/api/ledger?date=` (Jalali day 1 of the stored view-month, as Gregorian ISO). Mutations go straight to the Nest API; in-memory composables hold the working set. Dashboard derives from those collections. Transactions uses `GET /api/ledger`. Composables convert ISO ↔ Jalali at the HTTP boundary (`src/utils/moneyApi.ts`); UI types stay Jalali year/month/day.
- Excel backup reads the in-memory cache and `PUT /api/wallet` on import, then reloads collections + ledger.

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

Guest routes (`meta.public`) skip the auth guard. All other routes require a Better Auth session (`ensureAuthReady` then `useAuth`). Unauthenticated visits redirect to `/login?redirect=…`. Logged-in visits to `/login` or `/` go to dashboard. `App.vue` hides navbar + bottom nav when `hideChrome` or logged out; `meta.fullBleed` removes main padding (landing).

## Pages and their components
Unchanged from the Vue UI map: `Landing/`, `Auth/`, `Dashboard/`, `Deposits/`, `Transactions/`, `Expenses/`, `ExpenseEntry/`, `Bills/`, `Installments/`, `InstallmentDetail/`, `components/shared/`. See previous architecture notes for component lists.

Deposits list: `DepositList` (header + empty state) → `DepositWallet` (`.deposit-pocket`: fanned cards above a dark back, SVG front with dashed stitch, centered total + eye toggle; lifted card moves to the top with Edit/Delete) → `DepositCard` (full card `h-52`: note + `AppMoneyMark` accent logo top-right, amount center, dates bottom). `shared/AppMoneyMark.vue` — app chart icon + “money” in `text-secondary`. Hero plate stays `BankCardPlastic` + `BankCardMandala`. `DepositForm` scrolls into view when editing starts.

## Composables (`front-end/src/composables/`)
- `useAuth.ts` — Better Auth email/password (`login` / `register` / `logout` / `requestNewPassword`); session in memory. `ensureAuthReady()` hydrates session then loads collections. Forgot password calls `POST /api/auth/request-password-reset`; the server emails a generated password (SMTP or Nest log) then hashes it onto `accounts`.
- `loadMoneyCollections.ts` — `Promise.all` of `loadBills` / `loadDeposits` / `loadExpenses` / `loadInstallments` / `loadLedger`; `clearMoneyCollections` on logout (memory only).
- `useBills.ts` — REST bills; `loadBills` from `GET /api/bills`. Logos uploaded as `logoUrl` data URLs. View-month in `localStorage` (`money-managment:bills-view-month`); new bills default to that Jalali month; POST sends `startOn`/`endOn` ISO.
- `useBillLogos.ts` — in-memory cache; `loadBillLogo` fetches `/api/bills/:id/logo` as a blob URL.
- `useBankDeposits.ts` / `useExpenses.ts` — `loadDeposits` / `loadExpenses` plus REST CRUD; view-month in `localStorage`.
- `useInstallments.ts` — `loadInstallments` from `v_installments`; `setPaid` → `PATCH /api/installments/:id/paid`.
- `useLedger.ts` — `GET /api/ledger?date=` (Jalali month-first as ISO) for the Transactions statement. View-month stays in `localStorage`; switching months refetches.
- `useDashboard.ts` — still derived on the client from the hydrated collections.
- Other UI composables (`useToast`, printer flows, etc.) unchanged.
- `useLoadingOverlay.ts` + `AppLoadingOverlay.vue` — full-screen centered LOADING + segmented progress bar + Please Wait (`main.css` `.loading-screen*`); ref-counted via `api()` and Better Auth fetch, plus route changes (except `meta.skipLoadingOverlay` printer routes). Use `runWithLoading()` for ad-hoc waits.

## Types / utils
Same Vue types as before (`bill.ts`, `expense.ts`, `installment.ts`, `ledger.ts`, `bankDeposit.ts`) — Jalali ints for pickers. API DTOs use ISO dates (`startOn`/`endOn`, `occurredOn`, `arrivedOn`/`bookedOn`, installment `dueDate`). Excel backup still stores Jalali numbers for humans; convert on import/`PUT /api/wallet`.

## Theme tokens (`styles/theme.css`)
Three colors only: `background` `#19191B` (60%), `text` `#8C8E92` (30%), `accent` `#FF5410` (10%). Exception: `stamp-approved` `#A8DFC4` pastel green for Approved / auth success stamps on receipts only; `status-*` pastels for installment badges; `deposit-card-{sky,mint,peach,lilac,rose}` pastels + `deposit-folder` / `deposit-folder-front` for the deposits wallet. Every other token aliases one of them: `surface`/`black`/`foreground`/`on-accent`/`on-paper` = background; `primary`/`secondary`/`text-muted`/`white`/`success`/`warning`/`paper`/`printer` = text; `danger` = accent. Fonts: `font-display` Archivo Variable (h1/h2 via base layer, big numbers), `font-sans` IBM Plex Sans (`font-mono` aliases it). Fonts are bundled with `@fontsource` and imported in `main.ts`. `shadow-*` utilities are redefined as 1px hairline outlines; `blur-*`/`drop-shadow-*` are cleared; the `rounded-*` scale tops out at 4px.

## Receipt printer (`components/shared/ReceiptPrinter*`)
`ReceiptPrinterRoot` (stage + `pinSlotOpen`) → `ReceiptPrinterMachine` (dark bar: slot, LED, `ReceiptPrinterScreen` + `ReceiptPrinterStatus`) → `ReceiptPrinterOutput` (mouth under the bar; sheet feeds down) → `ReceiptPrinterPaper` (zigzag mask) with `ReceiptPaperHeader` / `ReceiptPaperFooter`. Used by Expense, BillDefinition, Installment printers, plus AuthTicketPrinter (pinned, no tear-off).

## Landing (`components/Landing/`)
`LandingScreen` (max-w-6xl; every section is its own `grid-cols-12 gap-x-6`) → `LandingBrand`, `LandingPitch` (headline + copy), `LandingContinueButton` (the only button), `LandingProductPreview` (static dashboard header + `LandingPreviewBalance` + `LandingPreviewStatement`, sample Aban 1405 data), `LandingFeatures`, `LandingFooter`.
