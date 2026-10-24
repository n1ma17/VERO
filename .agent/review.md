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
- [i18n] UI text is hard-coded in English; no RTL/Persian support yet. (found 2026-10-24)
- [currency] `formatAmount` is fixed to USD. (found 2026-10-24)
- [tooling] No ESLint/Prettier or tests configured yet. (found 2026-10-24)
