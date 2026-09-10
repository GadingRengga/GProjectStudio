# src/components — Atomic Design

Custom components follow Atomic Design. **Read `docs/COMPONENTS.md` before adding or editing any component here.**

| Folder | Level | Naming | Rule |
|---|---|---|---|
| `atoms/` | Smallest unit | `App[Name].vue` | No internal state, no composables, no business logic |
| `molecules/` | 2–5 atoms | `[Function].vue` | Lightweight local state only; no data composables |
| `organisms/` | Full sections | `[Feature].vue` | May hold UI state; **never** import repositories/data composables — data comes via props from the View |

Decision tree: does TailAdmin already have it? → use the TailAdmin component (`src/components/ui/`, `layout/`, `forms/`, …). Only build here when it doesn't exist.
