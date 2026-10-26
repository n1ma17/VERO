# Agent instructions

Long-term memory lives in `.agent/` at the **repo root**. App code lives in `front-end/`.

**Do not scan the whole codebase first.** Read `.agent/` memory, then open only the files that memory (or the user’s request) says you need.

Coding rules for the Vue app: `front-end/AGENTS.md`.

---

## Memory files

| File | Role | When to read | When to write |
| --- | --- | --- | --- |
| `.agent/architect.md` | Map of folders, routes, pages, components, composables, tokens | **Start of every task** | After any add / rename / remove of structure |
| `.agent/remember.md` | Preferences, decisions, gotchas, task log | **Start of every task** | **End of every task** |
| `.agent/review.md` | Finish checklist + open issues / tech debt | **Start of every task** (open issues) and before finishing | When you find an issue you are not fixing, or you resolve one |

Canonical memory is the **root** `.agent/` folder, not `front-end/.agent/`.

---

## Start of every task (do this first)

1. Read `.agent/architect.md`, `.agent/remember.md`, and `.agent/review.md`.
2. Treat them as the current state of the project. Do not re-explore `front-end/` unless memory is missing the area you need.
3. Open only the source files you will change, or that memory names as relevant.
4. If memory and code disagree, **the code wins** — fix the memory at the end of the task.

---

## End of every task (do not skip)

1. Walk through the checklist in `.agent/review.md`. From `front-end/`, run `npm run build` and fix failures.
2. Update `.agent/architect.md` if structure changed.
3. **Remember:** append a task-log entry at the top of the log in `.agent/remember.md` (`YYYY-MM-DD — summary (files touched)`). Add any new preference, decision, or gotcha to the matching section.
4. Add unresolved issues to `.agent/review.md`; remove ones you fixed.

Keep memory short and factual. When the task log grows past ~30 entries, compress older ones into a few summary lines.
