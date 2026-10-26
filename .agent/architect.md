# Architecture map

Keep this file in sync with the code. It should let an agent understand the project without opening every file.

## Repo layout
- Git remote: `origin` → `https://github.com/n1ma17/VERO.git` (branch `master`). One repo for the whole project; do not add nested `.git` under `front-end/` or `back-end/`.
- `front-end/` — Vue app. Talks to Nest over HTTP (`VITE_API_URL`, default `http://localhost:3000`). View-month UI state stays in `localStorage`.
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

Storage and API dates are Gregorian ISO `YYYY-MM-DD`. Views still group by Jalali month via `date_to_jalali` (matches `jalaali-js` 2.0.1). Overdue uses the date in `Asia/Tehran`. Bills count in the ledger whether or not they are paid.

## Backend stack (`back-end/`)
- NestJS 12, Express, `bodyParser: false` (Better Auth reads raw bodies)
- Global prefix `api` except `GET /`
- `@thallesp/nestjs-better-auth` + `kyselyAdapter` on the shared `pg.Pool` (`usePlural: true`)
- Arcjet Shield + fixed window (120/min; `ARCJET_MODE=DRY_RUN` locally)
- Feature modules in `src/module/`: `users`, `bills`, `deposits`, `expenses`, `installments`, `ledger`, `dashboard`, `wallet`
- Infra in `src/lib/`: `database` (`PgModule`), `auth`, `arcjet`
- Scripts: `npm run db:migrate` (applies `database/sql`), `npm run db:seed` (admin user + default wallet from repo-root `money-management-backup-2026-10-26.xlsx`, override with `ADMIN_BACKUP_XLSX`)

### HTTP (session cookie required except `GET /` and `/api/auth/*`)
| Method | Path | Role |
| --- | --- | --- |
| POST/GET | `/api/auth/*` | Better Auth (sign-up, sign-in, sign-out, session) |
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
- Vue 3.5 (`<script setup lang="ts">`), TypeScript 6, Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS)
- Vue Router 5 (`createWebHistory`, lazy-loaded pages)
- Path alias: `@` → `src`
- `better-auth/vue` client (`src/api/authClient.ts`); REST helper `src/api/http.ts` (`credentials: 'include'`)
- On boot / login: parallel `GET` of `/api/bills`, `/api/deposits`, `/api/expenses`, `/api/installments`, and `/api/ledger?date=` (Jalali day 1 of the stored view-month, as Gregorian ISO). Mutations hit the same REST resources then update local refs; ledger refetches from the API. Dashboard still computes in the client from the collection cache. Composables convert ISO ↔ Jalali at the HTTP boundary (`src/utils/moneyApi.ts`); UI types stay Jalali year/month/day.
- Excel backup reads the in-memory cache and `PUT /api/wallet` on import, then reloads the four collection endpoints plus the ledger.

## Routes
| Path | Name | Page |
| --- | --- | --- |
| `/` | `landing` | `pages/LandingPage.vue` (public; `hideChrome`, `fullBleed`) |
| `/login` | `login` | `pages/AuthPage.vue` (public; `hideChrome`) |
| `/dashboard` | `dashboard` | `pages/DashboardPage.vue` |
| `/transactions` | `transactions` | `pages/TransactionsPage.vue` |
| `/deposits` | `deposits` | `pages/DepositsPage.vue` |
| `/bills`, `/bills/:id` | `bills` | `pages/BillsPage.vue` (optional `id` = edit bill) |
| `/installments` | `installments` | `pages/InstallmentsPage.vue` |
| `/installments/:id` | `installment-detail` | `pages/InstallmentDetailPage.vue` |
| `/expenses` | `expenses` | `pages/ExpensesPage.vue` |
| `/expenses/entry`, `/expenses/entry/:id` | `expense-entry` | `pages/ExpenseEntryPage.vue` (optional `id` = edit expense) |

Guest routes (`meta.public`) skip the auth guard. All other routes require a Better Auth session (`ensureAuthReady` then `useAuth`). Unauthenticated visits redirect to `/login?redirect=…`. Logged-in visits to `/login` or `/` go to dashboard. `App.vue` hides navbar + bottom nav when `hideChrome` or logged out; `meta.fullBleed` removes main padding (landing).

## Pages and their components
Unchanged from the Vue UI map: `Landing/`, `Auth/`, `Dashboard/`, `Deposits/`, `Transactions/`, `Expenses/`, `ExpenseEntry/`, `Bills/`, `Installments/`, `InstallmentDetail/`, `components/shared/`. See previous architecture notes for component lists.

## Composables (`front-end/src/composables/`)
- `useAuth.ts` — Better Auth email/password (`login` / `register` / `logout`); session in memory. `ensureAuthReady()` hydrates session then loads each collection API.
- `loadMoneyCollections.ts` — `Promise.all` of `loadBills` / `loadDeposits` / `loadExpenses` / `loadInstallments` / `loadLedger`; `clearMoneyCollections` on logout.
- `useBills.ts` — REST bills; `loadBills` from `GET /api/bills`. Logos uploaded as `logoUrl` data URLs. View-month in `localStorage` (`money-managment:bills-view-month`); new bills default to that Jalali month; POST sends `startOn`/`endOn` ISO.
- `useBillLogos.ts` — in-memory cache; `loadBillLogo` fetches `/api/bills/:id/logo` as a blob URL.
- `useBankDeposits.ts` / `useExpenses.ts` — `loadDeposits` / `loadExpenses` plus REST CRUD; view-month in `localStorage`.
- `useInstallments.ts` — `loadInstallments` from `v_installments`; `setPaid` → `PATCH /api/installments/:id/paid`.
- `useLedger.ts` — `GET /api/ledger?date=` (Jalali month-first as ISO) for the Transactions statement. View-month stays in `localStorage`; switching months (or a collection mutation) refetches.
- `useDashboard.ts` — still derived on the client from the hydrated collections.
- Other UI composables (`useToast`, printer flows, etc.) unchanged.

## Types / utils
Same Vue types as before (`bill.ts`, `expense.ts`, `installment.ts`, `ledger.ts`, `bankDeposit.ts`) — Jalali ints for pickers. API DTOs use ISO dates (`startOn`/`endOn`, `occurredOn`, `arrivedOn`/`bookedOn`, installment `dueDate`). Excel backup still stores Jalali numbers for humans; convert on import/`PUT /api/wallet`.

## Theme tokens (`styles/theme.css`)
Unchanged. Minimal palette; variants use opacity. See previous token table.
