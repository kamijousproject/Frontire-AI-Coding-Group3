# Phase 04 — UI Review

**Audited:** 2026-05-13
**Baseline:** 04-UI-SPEC.md (approved design contract)
**Screenshots:** Not captured — Playwright CLI unavailable (dev server confirmed live at localhost:3000 via HTTP 200 after redirect)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Spec copy matches for all declared strings; missing input aria-label degrades screen-reader naming |
| 2. Visuals | 3/4 | ARIA roles and hierarchy correct; input lacks accessible name (no aria-label/labelledby); no loading indicator during 200ms debounce |
| 3. Color | 4/4 | Accent (bg-blue-100 / hover:bg-blue-50) used exactly as spec declares; no hardcoded hex values; no rogue bg-blue-* usage |
| 4. Typography | 2/4 | font-semibold (600) used in WeatherCard violates spec rule "exactly 2 weights: 400 and 700 only"; SearchBar itself is clean |
| 5. Spacing | 4/4 | All spacing tokens from declared scale (px-4/py-2 = md/sm); no arbitrary [px] or [rem] values found |
| 6. Experience Design | 2/4 | No loading feedback during 200ms debounce fetch; non-OK HTTP responses leave stale results visible; no visual indication input is disabled when isFull |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **No loading indicator during debounce fetch window** — Users who type 2+ characters see no feedback for up to 200ms+ (network latency adds to debounce delay); perceived as unresponsive on slow connections — Add an `isLoading` boolean state set to `true` when setTimeout fires and `false` in the fetch finally block; render a spinner or "Searching..." text inside the dropdown panel while loading.

2. **font-semibold (weight 600) in WeatherCard violates spec typography contract** — Spec declares exactly 2 weights (400 regular, 700 bold via `<strong>`); `font-semibold` on `WeatherCard` line 37 (`text-lg font-semibold`) introduces a third weight that was explicitly forbidden by 04-UI-SPEC.md — Change `font-semibold` to `font-bold` in `src/components/WeatherCard.tsx` line 37 to match the 2-weight contract.

3. **Input has no accessible name (no aria-label or associated label element)** — Screen readers announce the field as "combobox" with no name; users relying on AT cannot identify what the field is for without visually seeing the placeholder (which is not reliably announced) — Add `aria-label="Search for a city"` to the `<input>` element in SearchBar.tsx line 150.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**What the spec declares vs what was built:**

| Spec string | Implemented string | Match |
|-------------|-------------------|-------|
| `Search for a city...` (placeholder) | `Search for a city...` (line 160) | PASS |
| `No cities found for '{query}'` | `No cities found for &apos;{query}&apos;` (line 180) | PASS — `&apos;` renders as `'` correctly |
| `City already added` | `City already added` (line 165) | PASS |
| `City list full (10/10)` via title/aria | No equivalent rendered text; `isFull` triggers `opacity-50 cursor-not-allowed` on `<li>` only | WARNING — no visible "list full" text; tooltip or aria-description absent |

**Finding 1.1 — WARNING:** The spec copywriting contract lists `City list full (10/10)` as a string to preserve (via `title` attribute on the original disabled button). The `<li role="option">` implementation carries no `title`, `aria-description`, or visible text communicating the full state. A user who does not understand why clicking does nothing gets zero feedback. File: `src/components/SearchBar.tsx` line 190 — the `onMouseDown` handler silently no-ops when `isFull`.

**Finding 1.2 — PASS:** No generic labels (`Submit`, `OK`, `Cancel`, `Save`, `Click Here`) found anywhere in the codebase.

**Finding 1.3 — PASS:** Empty state copy `No cities found for '{query}'` correctly interpolates the live query value as required by AUTO-02.

---

### Pillar 2: Visuals (3/4)

**Finding 2.1 — WARNING:** The `<input>` has no accessible name. It carries `role="combobox"`, a `placeholder`, and `aria-expanded`, but no `aria-label` or `<label>` association. WAI-ARIA combobox pattern requires an accessible name. Screen readers will announce "combobox" without any identifying label. File: `src/components/SearchBar.tsx` line 150–162.

**Finding 2.2 — WARNING:** No loading indicator during the debounce window or while the fetch is in flight. After typing 2+ characters the user sees nothing for at least 200ms (plus network latency). The spec's state inventory does not define a loading state, but the absence of any feedback is a perceivable UX gap. Contrast: `WeatherCard` (line 29–33) shows a spinner during weather fetch — inconsistent loading treatment across the same app.

**Finding 2.3 — PASS:** Visual hierarchy in the dropdown is correct. Matched prefix renders bold via `<strong>` (line 19), region and country are plain text, and the highlighted row uses `bg-blue-100` which provides clear keyboard focus indication.

**Finding 2.4 — PASS:** No icon-only buttons exist in `SearchBar.tsx`. The `×` remove button in `WeatherCard` correctly carries `aria-label="Remove city"` (WeatherCard line 22).

**Finding 2.5 — PASS:** ARIA combobox attribute set is complete: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant` — all present and wired to live state.

---

### Pillar 3: Color (4/4)

**Finding 3.1 — PASS:** Accent color usage is exactly as spec declares:
- `bg-blue-100` — keyboard-highlighted `<li>` only (line 192) — CORRECT
- `hover:bg-blue-50` — unhighlighted `<li>` hover only (line 192) — CORRECT
- No other `bg-blue-*` usage in the file

**Finding 3.2 — PASS:** No hardcoded hex colors (`#rrggbb`) or `rgb()` values found in any `.tsx` file.

**Finding 3.3 — PASS:** 60/30/10 distribution is maintained:
- 60% dominant: `bg-white/20 backdrop-blur-sm` (input surface, glass) — correct
- 30% secondary: `bg-white/90 backdrop-blur-sm` (dropdown panel) — correct
- 10% accent: `bg-blue-100` / `hover:bg-blue-50` (highlighted rows only) — correct

**Finding 3.4 — PASS:** Destructive state (`text-red-300` for duplicate error, line 165) is contained to exactly the declared element.

**Finding 3.5 — PASS:** `text-primary`, `bg-primary`, `border-primary` count = 0. Project correctly avoids framework primary token conflicts.

---

### Pillar 4: Typography (2/4)

**Weight distribution across codebase (components directory):**
- `font-bold` — present (WeatherCard line 43, SearchBar via `<strong>`)
- `font-semibold` — present (WeatherCard line 37: `text-lg font-semibold`)

**Finding 4.1 — WARNING (BLOCKER for spec compliance):** `src/components/WeatherCard.tsx` line 37 uses `font-semibold` (weight 600). The 04-UI-SPEC.md Typography section explicitly states: "Exactly 2 weights in use: 400 (regular) and 700 (bold, only for matched prefix via `<strong>`)." and "Do NOT add `font-semibold` (600) to suggestion rows." The prohibition targets suggestion rows specifically, but the codebase-wide audit reveals `font-semibold` active in WeatherCard city name display. This introduces a third weight not in the declared contract.

**Finding 4.2 — PASS (SearchBar scope):** Within `SearchBar.tsx`, only `text-sm` is used (lines 165, 178, 191) and no explicit weight class is applied — weight is `<strong>`-only for bold, which is correct.

**Font size distribution (all components):**
- `text-xs` — WeatherCard (country, feels-like, stat labels)
- `text-sm` — SearchBar (all dropdown copy), WeatherCard (condition, error)
- `text-lg` — WeatherCard (city name)
- `text-2xl` — WeatherCard (temperature)

Four distinct sizes in use — within the 4-size limit. Score would be 3 except for the weight violation which justifies the downgrade.

**Finding 4.3 — INFO:** Input uses no explicit size class, defaulting to `text-base` (16px) per Tailwind defaults — matches spec's "16px (base) — `text-base` (implicit)" declaration.

---

### Pillar 5: Spacing (4/4)

**Spacing class frequency (all components):**

| Class | Count | Spec Token |
|-------|-------|-----------|
| `px-4` | 3 | md (16px) — CORRECT |
| `py-2` | 3 | sm (8px) — CORRECT |
| `py-4` | 2 | md (16px) — CORRECT |
| `py-1` | 2 | xs (4px) — CORRECT |
| `p-4` | 2 | md (16px) — CORRECT |
| `gap-4` | 2 | md — within declared scale |
| `gap-2` | 2 | sm — within declared scale |
| `p-2` | 1 | sm — within declared scale |
| `px-3` | 1 | not on declared token list but standard Tailwind step |
| `py-3` | 1 | not on declared token list but standard Tailwind step |
| `space-y-1` | 1 | xs — within declared scale |

**Finding 5.1 — PASS:** No arbitrary spacing values (`[12px]`, `[1.5rem]`, etc.) found anywhere in `.tsx` files.

**Finding 5.2 — INFO:** `px-3` (12px) and `py-3` (12px) appear in WeatherCard (`px-3 py-1` on Retry button, line 58). These are not in the declared spacing scale (which jumps from 8px to 16px). However, these are on a UI element outside SearchBar's scope and represent a minor gap; they do not break the rhythm.

**Finding 5.3 — PASS:** SearchBar dropdown items use exactly `px-4 py-2` as specified in both the Spacing Scale table ("Dropdown list items: px-4 py-2") and the Component Anatomy table. Perfect match.

**Finding 5.4 — PASS:** `mt-1` on the error `<p>` (line 165) and on the dropdown `<ul>` (line 172) matches the spec's stated layout — tight 4px separation from the input.

---

### Pillar 6: Experience Design (2/4)

**State coverage audit:**

| State | Present | Notes |
|-------|---------|-------|
| Loading (debounce in-flight) | NO | No visual feedback during 200ms wait + network round-trip |
| Empty results | YES | "No cities found for '{query}'" (line 174–181) |
| Error (network) | PARTIAL | AbortError silently discarded (per spec); non-OK HTTP silently discarded — stale results remain |
| Duplicate entry | YES | "City already added" with 3s auto-clear (line 165) |
| List full | PARTIAL | Opacity reduced + cursor-not-allowed; no visible text announcement |
| Keyboard highlight | YES | `bg-blue-100` on highlighted row (line 192) |
| Unmount cleanup | YES | `useEffect` cleanup aborts in-flight fetch on unmount (lines 62–64) |

**Finding 6.1 — WARNING:** No loading state during the debounce+fetch cycle. After 2 characters the user sees a blank input with no indication a search is pending. At 200ms debounce + typical API latency (50–300ms), total perceived wait is 250–500ms with no spinner, skeleton, or "Searching..." copy. File: `src/components/SearchBar.tsx` — `handleChange` has no `setIsLoading(true)` call.

**Finding 6.2 — WARNING:** Non-OK HTTP responses (`!res.ok`) from the `/api/v1/cities/search` endpoint are completely silent. If the server returns 500, `setResults` and `setShowDropdown` are not called (lines 89–93). If the dropdown was previously open with results, those stale results remain visible after the next failed fetch. The spec says "all other errors → silent discard" which technically covers this, but the visible stale state is a confusing UX outcome that was not spec'd as acceptable behavior.

**Finding 6.3 — WARNING:** When `isFull` is true, mouse clicks on suggestions are silently ignored (line 190: `if (!isFull) handleSelect(r)`). Keyboard Enter path goes to `handleSelect` which has `if (cities.length >= 10) return` — also silent. The user cannot distinguish "this click did nothing" from "a bug occurred." The spec mentions preserving "City list full (10/10)" title attribute intent but the implementation does not carry a visible or audible message when the full-state action is attempted.

**Finding 6.4 — PASS:** AbortController cleanup on unmount is correctly implemented (lines 62–64). This prevents stale state updates on dead components.

**Finding 6.5 — PASS:** `ArrowDown` with empty results does not break — `Math.min(-1+1, 0-1) = Math.min(0,-1) = -1` keeps index at -1. Correct edge-case handling.

**Finding 6.6 — PASS:** `ArrowUp` clamp at 0 matches spec (`max(i-1, 0)`). Keyboard nav cannot index below 0, preventing out-of-bounds access.

**Finding 6.7 — PASS:** Tab key does not call `e.preventDefault()` (line 126 comment confirms intent). Focus movement is natural.

**Finding 6.8 — PASS:** `onMouseDown` with `e.preventDefault()` used instead of `onClick` (line 190), correctly firing before input `onBlur` so the dropdown does not close before selection is registered.

---

## Registry Safety

Registry audit: shadcn not initialized (`components.json` absent). No third-party registry blocks to audit. Registry Safety section not applicable.

---

## Files Audited

- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/src/components/SearchBar.tsx` — primary audit target (203 lines)
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/src/components/WeatherCard.tsx` — cross-component typography audit
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/src/components/WeatherGrid.tsx` — state/loading pattern reference
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/src/app/globals.css` — font variable verification
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/src/app/page.tsx` — loading prop wiring reference
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/.planning/phases/04-autocomplete-ui/04-UI-SPEC.md` — design contract baseline
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/.planning/phases/04-autocomplete-ui/04-01-SUMMARY.md` — execution summary
- `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/.planning/phases/04-autocomplete-ui/04-01-PLAN.md` — execution plan
