# Memory — Nest API + Better Auth

Last updated: 2026-10-26

## What was built

- Connected local Postgres `app_money` through `PgModule` / `PgService` (shared pool).
- Better Auth (`/api/auth`) with Kysely adapter, `usePlural: true`, vin-style `UsersModule`.
- Arcjet Shield + 120/min window (`DRY_RUN` locally).
- Money APIs: bills, logos, deposits, expenses, installments, ledger, dashboard; wallet is import-only (`PUT`).
- Vue composables load each collection from its own GET; Excel backup uses `PUT /api/wallet`.
- Migration `database/sql/004_better_auth.sql`. `npm run db:seed` creates admin Nima Abbasi and imports `money-management-backup-2026-10-26.xlsx` from the repo root.

## Decisions made

- Money tables stay snake_case; auth tables are Better Auth camelCase plural.
- `user_id` on money tables is `text` so Better Auth ids fit.
- Frontend loads bills, deposits, expenses, and installments from their own GET endpoints and still computes dashboard/ledger in the client.
- Logo API accepts JPEG/PNG/WebP/GIF only (no SVG).
- User `role` is `ADMIN` | `USER` (not vin's `PRINCIPLE`).

## Problems solved

- Better Auth `usePlural` must be passed to `kyselyAdapter` directly, not via `database: { dialect, type }`.
- Seed `ON CONFLICT` cannot reuse one `$n` for `varchar` `accountId` and `text` `userId`.
- Vue `erasableSyntaxOnly` forbids constructor parameter properties (`ApiError`).

## Current state

API and Vue both build. Login as the seeded admin works. A test salary deposit of 1,500,000 Toman is stored in `bank_deposits` and shows on the dashboard. Dev servers: Nest `:3000`, Vite `:5173`.

## Next session starts with

- Confirm Nest (`back-end/ npm run start:dev`) and Vite (`front-end/ npm run dev`) if they are not running, then continue from remaining review.md items or new UI work.

## Open questions

- Production Arcjet key / Observe keys / email provider are still local-dev placeholders.
- Admin password lives in `back-end/.env` as `ADMIN_PASSWORD` (not stored here).
