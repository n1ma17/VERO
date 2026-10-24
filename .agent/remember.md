# Remember

Long-term memory for the agent. Read at the start of every task, update at the end.

## User preferences
- The user writes in Persian (Finglish). Reply in the user's language; code, comments, and memory files stay in English.
- Strict component-based architecture: no logic in pages, every component owns its logic.
- Every page has a matching folder in `components/` with the same name.
- Tailwind for all styling; all colors from `src/styles/theme.css`.
- Agent must use the `.agent/` memory (architect / remember / review) instead of re-reading everything.

## Decisions
- Tailwind v4 CSS-first config: theme is defined with `@theme` in `theme.css`; there is no `tailwind.config.js`.
- `--color-*: initial` in `theme.css` removes the default palette so only theme colors can be used.
- Page files are named `<Name>Page.vue`; their component folder is `components/<Name>/` (without the `Page` suffix).
- Shared reactive state lives in composables as module-level refs (simple singleton store). No Pinia yet — add it only if state grows complex.
- Data is stored in `localStorage` until a backend exists.

## Gotchas
- Tailwind cannot see dynamically built class names; use lookup objects with full class strings.
- `bg-white`, `text-black`, `bg-gray-*` etc. do not exist (palette disabled). Use `bg-surface`, `text-content`, ...

## Task log
<!-- Newest first. Format: - YYYY-MM-DD — summary (files touched) -->
- 2026-10-24 — Initial setup: Vite + Vue 3 + TS, Tailwind v4, Vue Router, theme file, Dashboard + Transactions example pages, `AGENTS.md`, `.agent/` memory. Build passes.
