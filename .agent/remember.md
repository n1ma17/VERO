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
- Money data lives in Postgres `app_money` via Nest. Vue composables hydrate from `GET /api/wallet` and mutate through REST. View-month keys stay in `localStorage`.
- Auth is Better Auth (email/password, httpOnly session cookie). Login/register UI is still an admission ticket; success stamps the stub then redirects; failure stamps REJECTED and shows Try again. Passwords hashed by Better Auth in `accounts.password`.
- User service follows the vin project: `UsersModule` + `PgService`, public columns only, `role` is `ADMIN` | `USER` (not vin's `PRINCIPLE`). Role/status are not client-writable.
- Nest Better Auth must construct `kyselyAdapter` with `usePlural: true` (tables are `users`/`sessions`/`accounts`/`verifications`). `bodyParser: false` in `main.ts`.
- Arcjet is global Shield + 120 req/min. Local `ARCJET_MODE=DRY_RUN`. Logo uploads reject SVG at the API.
- Installment status is never stored: `overdue` is derived from `dueDate` + `paidAt`. Only `paidAt` is persisted.
- Installments list is read-only; status is changed only on the detail page (user requirement).
- Paying happens through the receipt printer on the detail page: the printer prints first, then the installment is marked paid and the left card updates.
- When porting React/HTML+CSS the user provides: Vue primitives + `theme.css` tokens; complex 3D/::before chrome goes in `main.css` `@layer components` (same pattern as bank card / bottom nav). Receipt printer is the ICprint thermal body; print still follows `idle → processing → printing → complete` (not click-to-toggle).
- Receipt look: white card, colored status strip on top, notched dashed dividers, scalloped bottom, monospace values, "APPROVED" stamp on paid ones. Keep the stamp off data rows (on detail it has its own row).

- Ledger balance = all deposits (by counted month) minus all bill installments (by due month, paid or not) minus all expenses (by purchase month); cumulative, can be negative.
- Postgres lives in repo `database/` and local database `app_money` (PostgreSQL 18, port 5432, user `postgres`). Cluster files stay in `F:\database`. Money rows are per `user_id`. Installments and the ledger are views; only `paid_at` is stored. Jalali SQL matches `jalaali-js` 2.0.1. Overdue uses `Asia/Tehran`. Identity is Better Auth (`004_better_auth.sql`).
- Color language: deposits = success (green), bills = danger (red), expenses = warning (amber).
- Printer pages share `createPrinterFlow` (`usePrinterFlow.ts`); editing reuses the entry page with an optional `:id` route param.
- Charts are hand-written SVG with `fill-*`/`stroke-*` theme classes; no chart library. Dynamic sizes go in SVG attributes, never inline `style`.
- GitHub remote is `https://github.com/n1ma17/VERO.git` on `master`. The Vue app used to sit at the VERO root; it now lives under `front-end/` with `back-end/` and `database/` beside it.

## Gotchas
- Tailwind cannot see dynamically built class names; use lookup objects with full class strings.
- In Postgres, `offset` is reserved. Do not use it as a `generate_series` column alias.
- On this PC, `bash` launched from Windows Python is WSL and does not start. Apply SQL with `psql.exe`, Git Bash via `database/scripts/apply.sh`, or `npm run db:migrate` from `back-end/`.
- `@arcjet/nest` 1.14 peer range is Nest 10/11; this repo uses Nest 12 with `legacy-peer-deps=true` (same as vin).
- `bg-white`, `text-black`, `bg-gray-*` etc. do not exist (palette disabled). Use `bg-surface`, `text-content`, ...
- Nested `.git` folders in `front-end/` or `back-end/` make the root repo skip those trees. Keep a single `.git` at the repo root.

## Task log
<!-- Newest first. Format: - YYYY-MM-DD — summary (files touched) -->
- 2026-10-26 — Published the full monorepo to `https://github.com/n1ma17/VERO.git` (`master` @ `fb86318`). Vue moved under `front-end/`; Nest + Postgres schema added. Root `.gitignore` keeps `.env`, `node_modules`, and `dist` off the remote.
- 2026-10-26 — Bottom nav overlap on sm+: `sm:py-8` reset main `pb`; use `sm:pt-8` only (`App.vue`).
- 2026-10-26 — Admin seed loads `money-management-backup-2026-10-26.xlsx` via `npm run db:seed` (`scripts/lib/backup-xlsx.ts`, `import-wallet-snapshot.ts`, `seed.ts`).
- 2026-10-26 — Nest backend on local `app_money`: Better Auth + Arcjet, vin-style users module, money APIs, Vue wired to REST. Admin Nima Abbasi seeded. (`back-end/`, `front-end/src/api/`, composables, `database/sql/004_better_auth.sql`)
- 2026-10-26 — Local Postgres `app_money`: schema from the Vue model (users, bills, logos, payments, deposits, expenses) plus Jalali functions and ledger views. (`database/`, `architect.md`)
- 2026-10-26 — Agent workflow at repo root: always read `.agent/` (architect / remember / review) before work; write the task log to `remember.md` after. Canonical memory is root `.agent/`, not `front-end/.agent/`. (`AGENTS.md`, `.cursor/rules/agent-memory.mdc`, `architect.md`)
- 2026-10-26 — Deposits bank card: drop-shadow on tilted plate (not floor blur), larger scene on sm/md/lg, visible overflow so card isn’t clipped. (`BankCardPlastic`, `BankBalanceCard`, `main.css`).
- 2026-10-26 — Mobile-first pass: safe-area shell, stacked statement cards, landing/bank-card overflow, 16px inputs, full-width page CTAs, cash-flow tooltip below chart on small screens. (`App.vue`, navbar/nav, `LedgerTable`, landing, deposits card, forms, receipts, `theme`/`main.css`).
- 2026-10-26 — Bottom nav: removed Bills tab (5 tabs); Installments “Define a bill” → `/bills`; Due tab highlights on `/bills`. (`appNav.ts`, `InstallmentsDefineBillAction`, `InstallmentsPage`, `main.css`).
- 2026-10-26 — Auth ticket tab switch: `pinSlotOpen` keeps slot expanded; smooth `min-height` on login↔register; removed mouth `drop-shadow` (box-shadow + sheet padding for divider notches). (`ReceiptPrinterRoot`, `useAuthTicketPrinter`, `AuthTicketPrinter`, `main.css`, `AuthTicket`).
- 2026-10-26 — Replaced receipt printer chrome with user’s ICprint 3D thermal printer (glossy body, slot, LED, scalloped paper). Stages unchanged; paper feed is 2s ease. (`ReceiptPrinter*`, printer consumers, `theme.css` `printer` token, `main.css`).
- 2026-10-26 — Landing: content in `max-w-5xl px-4`; bank hero uses `LandingBankCard` (deposits-style mandala card). (`LandingScreen`, `LandingBankCard`, `LandingHeroVisual`).
- 2026-10-26 — Landing at `/` (gradient hero, floating receipt/card, CTA → login or dashboard); dashboard moved to `/dashboard`; tokens `landing-hero-*`, `on-hero*`. (`LandingPage`, `Landing/*`, router, `App.vue`, `appNav`, `theme.css`).
- 2026-10-26 — Auth: removed stub tear animation; success = stamp + brief pause + redirect. (`AuthTicket.vue`).
- 2026-10-26 — Auth gate: `/login` ticket with login/register, SUCCESS/REJECT stamps, stub tear, router guard, Sign out. (`AuthPage`, `Auth/*`, `useAuth`, `hashSecret`, router, `App.vue`, `AppNavbar`, `ReceiptBarcode` → shared).
- 2026-10-25 — Bottom nav: `max-w-5xl px-4` wrapper (aligned with main + AppNavbar); bar `width: 100%`.
- 2026-10-25 — Unified month navigator: `ViewMonthNavigator` + `JalaliMonthNavigatorBar` (shared); removed 4 page-specific navigators.
- 2026-10-25 — Theme simplified to background, primary, accent, success/danger/warning, text (+ surface white); removed chart/nav/printer/bank hex tokens; migrated components to core tokens + opacity (`theme.css`, bulk class renames, `expenseCategories.ts`).
- 2026-10-25 — Glass chrome: sticky blurred `AppNavbar`; frosted bottom pill (`backdrop-filter` in `main.css`).
- 2026-10-25 — Bottom nav: nav-light pattern (sliding top bar + beam, per-tab glow, `nav-tab-*` tokens); replaced scooped raised circle (`AppBottomNav`, `main.css`, `theme.css`, `App.vue` pb).
- 2026-10-25 — Deposits card 3D: Tailwind `rotate-x-*` was 2D `rotate` not `rotateX`; fixed with `.bank-card-scene` + `.bank-card-plate` in `main.css` (`bank-card-tilt-x/z`).
- 2026-10-25 — Deposits hero restyled closer to reference: light `bank-balance-backdrop`, balance + muted unit, mandala card (`BankBalanceCard`, `BankCardPlastic`).
- 2026-10-24 — Foundation through the first full money app: Vite/Vue/Tailwind, auth ticket, Jalali bills with derived installments, deposits, ledger, dashboard, expenses, Excel backup, receipt printer, bottom nav. Data in localStorage + IndexedDB.
