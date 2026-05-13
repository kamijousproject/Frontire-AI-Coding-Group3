# Phase 07: UI Polish — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 07-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 07-ui-polish
**Areas discussed:** Loading indicator style, Dropdown open-on-loading

---

## Loading Indicator Style

| Option | Description | Selected |
|--------|-------------|----------|
| "Searching…" text row | Same layout as "No cities found" row — reuses existing pattern, no new CSS | ✓ |
| Small dark spinner | border-based spinner centered in a single row | |
| Pulsing dots | Three animated dots with Tailwind animate-pulse | |

**User's choice:** "Searching…" text row (recommended)
**Notes:** Chosen for consistency — reuses the exact `<li>` structure of the empty-state row.

---

## Dropdown Open-on-Loading

| Option | Description | Selected |
|--------|-------------|----------|
| When debounce timer fires | Set isLoading=true and showDropdown=true inside setTimeout body, before fetch | ✓ |
| Immediately on 2+ chars typed | Open dropdown as soon as user types 2 characters | |

**User's choice:** When debounce timer fires (matches requirement: "from the moment the 200ms debounce timer fires")
**Notes:** Dropdown opens inside the setTimeout callback, not on keystroke.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stay true — new request is coming | isLoading remains true across cancellation, no flicker | ✓ |
| Briefly false, then true again | Reset to false on abort, then true again on next timer | |

**User's choice:** Stay true — prevent dropdown flicker across rapid keystrokes.
**Notes:** isLoading does NOT get set to false in the AbortError catch path.

---

## Claude's Discretion

None — all decisions were made by the user.

## Deferred Ideas

None.
