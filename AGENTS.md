# Agent Guide — money-managment

Vue 3 + TypeScript + Vite + Tailwind CSS v4 + Vue Router.
These rules are mandatory for every task. Do not break them unless the user explicitly asks.

---

## 1. Memory workflow (always follow)

The project keeps persistent memory in `.agent/` so you do not have to re-read the whole codebase every session.

| File | Role | When to read | When to write |
| --- | --- | --- | --- |
| `.agent/architect.md` | Map of the project: folders, routes, pages, components, composables, theme tokens | Start of every task | Whenever a file/route/component/composable/token is added, renamed, or removed |
| `.agent/remember.md` | Long-term memory: user preferences, decisions, gotchas, task log | Start of every task | End of every task |
| `.agent/review.md` | Review checklist + open issues / tech debt | Before finishing a task | When you find an issue you are not fixing now, or resolve one |

### Start of a task
1. Read `.agent/architect.md` and `.agent/remember.md`.
2. Trust them as the current state. Open only the source files you actually need to change or that the memory says are relevant.
3. If memory and code disagree, the code wins — fix the memory at the end of the task.

### End of a task (do not skip)
1. **Review**: walk through the checklist in `.agent/review.md` and run `npm run build`. Fix any failure.
2. **Architect**: update `.agent/architect.md` if the structure changed.
3. **Remember**: append a short entry to the task log in `.agent/remember.md` (date, what was done, files touched). Add any new decision, preference, or gotcha to the relevant section.
4. **Review log**: add unresolved issues to `.agent/review.md`; remove the ones you fixed.

Keep memory files short and factual. When the task log in `remember.md` grows past ~30 entries, compress older entries into a few summary lines.

---

## 2. Folder structure

```
src/
  App.vue                 # app shell only (navbar + <RouterView />)
  main.ts                 # app bootstrap
  router/index.ts         # routes, pages are lazy-loaded
  styles/
    main.css              # Tailwind entry (imports tailwind + theme)
    theme.css             # THE ONLY place colors are defined
  pages/                  # one file per route: <Name>Page.vue
  components/
    shared/               # components used by more than one page
    <Name>/               # components used only by <Name>Page.vue
  composables/            # shared state/logic used by several components (use<Name>.ts)
  types/                  # TypeScript types/interfaces
  utils/                  # pure helper functions (no Vue reactivity)
```

---

## 3. Component rules

1. **Component-based everything.** Split UI into small, focused components.
2. **Pages contain no logic.** A page file only imports components and arranges them in the template.
   - Allowed in a page: imports, layout markup with Tailwind classes, passing static props.
   - Not allowed in a page: `ref`, `reactive`, `computed`, `watch`, functions, API calls, composables, event handlers.
3. **Each component owns its logic.** State, computed values, handlers, and data fetching live in the component that uses them.
4. **Shared state** needed by several components goes in a composable in `src/composables/` and each component calls it directly. Do not lift state into the page.
5. **Page → component folder mapping.** For every page `src/pages/<Name>Page.vue` there is a folder `src/components/<Name>/` holding the components only that page uses.
   - Example: `DashboardPage.vue` → `components/Dashboard/`, `TransactionsPage.vue` → `components/Transactions/`.
   - When a component starts being used by a second page, move it to `components/shared/`.
6. Use `<script setup lang="ts">`, typed `defineProps<...>()` / `defineEmits<...>()`.
7. Naming: PascalCase multi-word file names for components (`TransactionForm.vue`), `Base*` prefix for generic UI primitives (`BaseButton`, `BaseCard`), `App*` for app-level singletons (`AppNavbar`).
8. Always import with the `@/` alias (`@/components/shared/BaseCard.vue`).

---

## 4. Styling rules (Tailwind only)

1. **All styling is done with Tailwind utility classes** in the template.
2. **No `<style>` blocks** in `.vue` files, no inline `style="..."`, no extra CSS files. The only CSS files are `src/styles/main.css` and `src/styles/theme.css`.
3. **All colors come from `src/styles/theme.css`.** The default Tailwind palette is disabled (`--color-*: initial`), so classes like `bg-blue-500` or `text-gray-700` do not exist and must not be used.
   - Use semantic tokens: `bg-primary`, `text-content-muted`, `border-border`, `bg-danger-soft`, ...
   - Never hard-code hex/rgb values or arbitrary colors (`bg-[#123456]`).
   - Need a new color? Add a semantic token to `theme.css` first, then record it in `.agent/architect.md`.
4. **Never build class names dynamically** (`` `bg-${tone}` `` breaks Tailwind's scanner). Use a lookup object with full class strings:
   ```ts
   const toneClasses = { success: 'bg-success-soft text-success', danger: 'bg-danger-soft text-danger' }
   ```
5. Variants (primary/danger/...) are expressed as props on shared components (see `BaseButton.vue`), not as ad-hoc class combos repeated across files.
6. Custom animations are defined as `--animate-*` + `@keyframes` inside `@theme` in `src/styles/main.css`, then used as Tailwind classes (`animate-receipt-feed`). Enter/leave effects use Vue `<Transition>` with Tailwind classes. No animation libraries unless the user asks.

---

## 5. Commands

- `npm run dev` — start dev server
- `npm run build` — type-check (`vue-tsc`) + production build. Must pass before finishing any task.
