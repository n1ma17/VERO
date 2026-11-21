# Review

Run this checklist before finishing every task. Then log anything left unresolved under "Open issues".

## Checklist
- [ ] `npm run build` passes (type-check + build).
- [ ] Pages (`src/pages/*`) contain only imports + layout markup — no `ref`/`computed`/functions/composables.
- [ ] Every new component sits in the right place: `components/<PageName>/` if used by one page, `components/shared/` if used by more.
- [ ] Every new page has its matching `components/<Name>/` folder and a route in `router/index.ts`.
- [ ] No `<style>` blocks, no inline `style=`, no new CSS files.
- [ ] No default Tailwind palette classes (`*-gray-*`, `*-blue-*`, `bg-white`, ...) and no hard-coded colors (`#hex`, `rgb()`, `bg-[...]`). Only `theme.css` tokens.
- [ ] No dynamically concatenated Tailwind class names.
- [ ] Props/emits are typed; imports use the `@/` alias.
- [ ] No dead code, unused imports, or leftover debug logs.
- [ ] `.agent/architect.md` reflects any structural change.
- [ ] `.agent/remember.md` has a task-log entry for this task.

## Open issues / tech debt
<!-- Format: - [area] description (found YYYY-MM-DD) -->
- [mobile] Capacitor release APK still needs a reachable LAN Nest (`VITE_API_URL`) and matching `AUTH_TRUSTED_ORIGINS`; production should use HTTPS API + secure cookies instead of cleartext/http scheme. (found 2026-11-21)
- [auth] Forgot password emails a generated password (weaker than a reset link). SMTP is off until `EMAIL_PROVIDER=smtp` and SMTP_* are set; otherwise the new password is only in the Nest log. (found 2026-10-28)
- [dashboard] Overview still derived in the client from collection caches; Transactions ledger refreshes on `bumpMoneyData()` after mutations (not only on full reload). (found 2026-10-26; sync fixed 2026-11-21)
- [data] `bill_logos` DB check still allows `image/svg+xml`; the Nest upload path rejects SVG. Align the SQL check if SVG should be gone entirely. (found 2026-10-26)
- [ops] Nest Observe stays off unless `OBSERVE_APP_KEY` + `OBSERVE_APP_SECRET` are real (placeholders used to 429). Optional for prod via observe.nestjs.com. (updated 2026-11-21)
- [ops] Nest crashes when an outbound HTTP/2 connection (likely Arcjet, `104.18.x.x:443`) times out: unhandled `'error'` on `ClientHttp2Session` kills the process, and the frontend then hangs on the loading overlay. Handle or isolate that error, or make Arcjet fail open. (found 2026-11-18)
- [ui] 3-color redesign: only the landing page was checked visually. Still to check: dashboard KPIs, cash-flow/ledger charts (series now share one gray, and legends may need +/− labels), auth ticket on gray paper, deposits bank card (still 3D tilt and a mandala pattern), printer, and loading segmented bar overlay. (found 2026-11-18)
- [ui] Feature pages (Dashboard, Transactions) still use many filled `bg-primary/10` pills and `rounded-full` badges; convert to hairline/uppercase labels so they match the landing page. (found 2026-11-18)
- [theme] User-picked category colors use theme tokens (accent, status-*, deposit-card-*). (updated 2026-11-21)
- [i18n] UI text is hard-coded in English; no RTL/Persian support yet. (found 2026-10-24)
- [data] Old `money-managment:transactions` localStorage key is orphaned (legacy USD data); harmless, could be cleared on load. (found 2026-10-24)
- [dashboard] `useDashboard` captures "today" when the component mounts; leaving the tab open past midnight shows yesterday until reload. (found 2026-10-24)
- [tooling] No ESLint/Prettier or tests configured yet. (found 2026-10-24)
- [tooling] `npx tsc --noEmit -p tsconfig.json` in `back-end/` fails on pre-existing `scripts/seed.ts(89)`: passes a `pg.Client` where `importWalletSnapshot` expects `PoolClient`. `nest build` (src only) is fine. (found 2026-11-21)
- [currency] A row's currency cannot be changed from the edit form (it keeps the entered currency by design); delete + re-add to change it. Client-side dashboard totals depend on `/api/currency` rates being loaded; before load they use 1:1 rates for one tick. (found 2026-11-21)
- [currency] Official IRR rate from the APIs is far from the free market; users should set the manual IRR rate in the navbar menu. (found 2026-11-21)
- [calendar] Bill installment expansion in Postgres (`v_installments`) is still Jalali-month based even when the UI is Gregorian; duration spans are approximate across calendars. Shared picker components are still named `Jalali*`. Excel backup still stores Jalali numbers. (found 2026-11-21)
- [backup] Import replaces all local data (no merge). View-month localStorage keys are not in the Excel file. (found 2026-10-24)
