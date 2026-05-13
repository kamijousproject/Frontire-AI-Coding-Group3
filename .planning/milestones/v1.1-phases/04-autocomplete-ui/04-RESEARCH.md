# Phase 04: Autocomplete UI - Research

**Researched:** 2026-05-12
**Domain:** React 19 / Next.js 16 client component — type-ahead autocomplete with keyboard navigation
**Confidence:** HIGH

---

## Summary

Phase 04 upgrades the existing `SearchBar.tsx` from a minimal stub to a fully-featured autocomplete combobox. The component already exists with the correct prop signature, debounce skeleton, click-outside handler, and basic dropdown render. What is missing is: AbortController cancellation on in-flight fetches, correct 200ms debounce timing (currently 300ms), full keyboard navigation (only Escape works today), highlighted prefix matching in suggestions, and proper ARIA combobox markup.

All work lands in a single file: `src/components/SearchBar.tsx`. No new routes, hooks, or library installs are needed. The API route (`/api/v1/cities/search`) is complete from Phase 03 and returns the correct `CityEntry[]` shape. `useCityStorage` is complete. `page.tsx` wiring is complete. This is a pure UI enhancement of one client component.

The correct pattern is a `useRef`-held `AbortController` (not a new one created on each render) paired with `clearTimeout` for debounce. The debounce fires at 200ms as required. Before each new fetch the previous controller is aborted and replaced. The dropdown is an ARIA `role="listbox"` with the input as `role="combobox"`. Keyboard-highlighted index is tracked with `useState<number>`. Prefix highlighting splits the suggestion string at the query boundary and wraps the matching prefix in `<strong>` — no library, no `dangerouslySetInnerHTML`.

**Primary recommendation:** Rewrite `SearchBar.tsx` in a single plan. The component is 116 lines today; the rewrite will be ~180 lines. No dependency installs required.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTO-01 | Debounced fetch (200ms) to `/api/cities/search` after ≥2 chars; AbortController cancels in-flight on each new debounce | Pattern 1 (AbortController + debounce), critical pitfall: current code uses 300ms — must change to 200ms |
| AUTO-02 | Dropdown: up to 8 suggestions in `City, Region, Country` format (region omitted if null); "No cities found for '{input}'" on empty | API route already returns LIMIT 8, ORDER BY population DESC; format pattern in Pattern 3 |
| AUTO-03 | Keyboard: ↑/↓ moves highlight, Enter adds city, Escape closes, Tab dismisses without selecting | WAI-ARIA combobox pattern; Pattern 2 (keyboard state management) |
| AUTO-04 | Typed characters appear bold in each suggestion row | Pattern 4 (safe prefix split + `<strong>`) — no library needed |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Debounced fetch + AbortController | Browser / Client | — | All state lives in the client component; no server involvement in timing logic |
| Suggestion data (LIMIT 8, population rank) | API / Backend | — | Already implemented in Phase 03 SQLite route; client just fetches |
| Keyboard navigation state (highlighted index) | Browser / Client | — | Pure UI state — `useState<number>` in SearchBar |
| ARIA combobox markup | Browser / Client | — | Accessibility attributes are HTML rendered client-side |
| Prefix highlight rendering | Browser / Client | — | JSX string-split — no server involvement |
| City persistence on selection | Browser / Client | — | `useCityStorage.addCity()` already wired in `page.tsx` |

---

## Standard Stack

### Core (already installed — zero new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | `useState`, `useRef`, `useEffect`, `useId` | Already in project [VERIFIED: package.json] |
| TypeScript | ^5 | Strict-mode type checking | Already in project [VERIFIED: package.json] |
| TailwindCSS | ^4 (CSS-first) | Utility classes for dropdown, focus-visible, z-index | Already in project; `@import "tailwindcss"` in globals.css [VERIFIED: globals.css] |
| Next.js | 16.2.6 | `'use client'` directive for client component | Already in project [VERIFIED: package.json] |

### No New Dependencies

Neither `use-debounce` (v10.1.1) nor `react-highlight-words` (v0.21.0) should be installed. Both problems are solved with ~10 lines of inline code each. Adding npm dependencies for trivial problems contradicts the project's lean-deps posture (0 UI component libraries installed in any phase). [ASSUMED: project has implicit lean-deps posture based on observation — no UI libs installed]

**Version verification:** All packages confirmed via `package.json` in project root — no `npm view` needed for installed packages.

---

## Architecture Patterns

### System Architecture Diagram

```
User types → <input> onChange
     │
     ▼
clearTimeout(debounceRef)
abort(abortControllerRef.current)       ← cancel previous in-flight fetch
     │
     ▼
debounceRef = setTimeout(200ms)
     │ fires after 200ms idle
     ▼
new AbortController → abortControllerRef.current
fetch('/api/v1/cities/search?q=...', { signal })
     │
     ├─ 200 OK → setResults(CityEntry[]) → setShowDropdown(true)
     ├─ err.name === 'AbortError' → ignore (not an error state)
     └─ other error → ignore (search is non-critical)
     │
     ▼
<ul role="listbox">
  highlightedIndex (useState<number>, -1 = none)
  │
  ├─ ArrowDown → highlightedIndex++
  ├─ ArrowUp   → highlightedIndex--
  ├─ Enter     → handleSelect(results[highlightedIndex])
  ├─ Escape    → setShowDropdown(false), reset index
  └─ Tab       → setShowDropdown(false), reset index (no selection)
```

### Recommended File Structure

No new files. Single file modification:

```
src/
└── components/
    └── SearchBar.tsx    ← rewrite (~180 lines)
```

All supporting infrastructure is already in place from Phases 02-03.

### Pattern 1: AbortController + debounce in a `'use client'` component

**What:** Hold an `AbortController` in a `useRef`. On each keypress: clear the pending debounce timer, call `.abort()` on the ref'd controller, create a new controller, store it, schedule a 200ms `setTimeout` that fetches with the new signal.

**When to use:** Any input-driven fetch where rapid typing would cause racing responses.

```typescript
// Source: codebase pattern from src/lib/weatherapi.ts (AbortController) +
//         inline debounce pattern already in SearchBar.tsx (debounceRef)
// Combined pattern verified against: https://svarden.se/post/debounced-fetch-with-abort-controller

const abortRef = useRef<AbortController | null>(null)
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const val = e.target.value
  setQuery(val)
  setHighlightedIndex(-1)
  setDuplicateError(false)

  if (debounceRef.current) clearTimeout(debounceRef.current)
  if (abortRef.current) abortRef.current.abort()

  if (val.length < 2) {
    setResults([])
    setShowDropdown(false)
    return
  }

  debounceRef.current = setTimeout(async () => {
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch(
        `/api/v1/cities/search?q=${encodeURIComponent(val)}`,
        { signal: controller.signal }
      )
      if (res.ok) {
        const data: CityEntry[] = await res.json()
        setResults(data)
        setShowDropdown(data.length > 0 || val.length >= 2) // show "no results" too
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return // silently cancel
      // other errors: silent — search is non-critical
    }
  }, 200) // AUTO-01: 200ms (not 300ms as currently coded)
}
```

**Critical detail:** `err.name === 'AbortError'` must be checked before treating a caught error as a display-worthy failure. Aborts throw a `DOMException` with `name: 'AbortError'`. [VERIFIED: MDN/fetch spec behavior, confirmed by multiple search sources]

### Pattern 2: Keyboard navigation with `highlightedIndex`

**What:** A `useState<number>` initialized at `-1` (nothing highlighted). Arrow keys increment/decrement clamped to `[0, results.length - 1]`. Enter selects only if index >= 0. Escape and Tab both close the dropdown; Tab does not select.

**When to use:** Any list-based selection that requires both mouse and keyboard paths.

```typescript
// Source: WAI-ARIA APG Combobox Pattern https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
// Implementation pattern from research

const [highlightedIndex, setHighlightedIndex] = useState(-1)

function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (!showDropdown) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault() // prevent scroll
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
      break
    case 'ArrowUp':
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
      break
    case 'Enter':
      e.preventDefault()
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelect(results[highlightedIndex])
      }
      break
    case 'Escape':
      setShowDropdown(false)
      setHighlightedIndex(-1)
      break
    case 'Tab':
      setShowDropdown(false)
      setHighlightedIndex(-1)
      // no preventDefault — let Tab continue normal focus movement
      break
  }
}
```

**Note on Tab:** `Tab` must NOT call `e.preventDefault()`. The requirement says "Tab dismisses without selecting" — the user's focus should move to the next element naturally. Calling `preventDefault()` would trap focus in the input.

### Pattern 3: ARIA combobox markup

**What:** The correct ARIA roles for an editable combobox with a listbox popup. DOM focus stays on the `<input>` at all times; `aria-activedescendant` points to the highlighted `<li>` id.

```typescript
// Source: WAI-ARIA APG https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/

const listboxId = useId() // React 19 — collision-safe id generation
const optionId = (i: number) => `${listboxId}-option-${i}`

// On the <input>:
// role="combobox"
// aria-expanded={showDropdown}
// aria-controls={listboxId}
// aria-autocomplete="list"
// aria-activedescendant={highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined}

// On the <ul>:
// role="listbox"
// id={listboxId}

// On each <li>:
// role="option"
// id={optionId(i)}
// aria-selected={i === highlightedIndex}
```

**Why `useId`:** React 19's `useId()` generates a stable, SSR-hydration-safe id without needing a manual counter. It is available in React 19 (confirmed via `require('react')` inspection). [VERIFIED: node_modules/react exports `useId`]

### Pattern 4: Safe prefix highlight (no library, no XSS risk)

**What:** Split the suggestion display string at the boundary of the typed query prefix and wrap only the matching segment in `<strong>`. Uses `String.slice()` on the city name only (not the full formatted string), rendered as JSX — never `dangerouslySetInnerHTML`.

**When to use:** When you need inline bold highlighting for a simple prefix match.

```typescript
// Source: React JSX rendering pattern (no external reference needed — pure JSX)
// Verified safe: splits into string segments rendered as text nodes + one <strong>

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !text.toLowerCase().startsWith(query.toLowerCase())) {
    return <>{text}</>
  }
  const prefix = text.slice(0, query.length)
  const rest = text.slice(query.length)
  return (
    <>
      <strong>{prefix}</strong>
      {rest}
    </>
  )
}

// Usage in dropdown list item:
// The requirement (AUTO-04) says "the characters the user typed appear bold in each suggestion row"
// highlighting is on the city name portion only; region/country are plain text
function formatSuggestion(city: CityEntry, query: string): React.ReactNode {
  const suffix = city.region ? `, ${city.region}, ${city.country}` : `, ${city.country}`
  return (
    <>
      <HighlightMatch text={city.name} query={query} />
      {suffix}
    </>
  )
}
```

**XSS safety:** Because we use JSX children (not `innerHTML`), React escapes all values. No sanitization library is needed. [VERIFIED: React JSX escaping is a framework guarantee]

### Pattern 5: "No cities found" empty state

**What:** The requirement specifies the exact string `"No cities found for '{input}'"`. This must appear when the API returns an empty array — not just when `showDropdown` is true without results.

```typescript
// Note: showDropdown must remain true even when results.length === 0
// so the "no results" message is visible. Control showDropdown independently
// from results.length.

{showDropdown && (
  <ul role="listbox" id={listboxId} ...>
    {results.length === 0 ? (
      <li role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500">
        No cities found for &apos;{query}&apos;
      </li>
    ) : (
      results.map((r, i) => (
        <li key={r.id} role="option" id={optionId(i)} aria-selected={i === highlightedIndex} ...>
          {formatSuggestion(r, query)}
        </li>
      ))
    )}
  </ul>
)}
```

### Anti-Patterns to Avoid

- **Creating AbortController outside the setTimeout callback:** If you create it before the timer, you abort it immediately on the next keypress — but you also need to start a new fetch for the NEW keystroke. The controller must be created inside the `setTimeout` callback so it governs only that specific fetch. [VERIFIED: observed in codebase weatherapi.ts pattern]
- **Using `e.preventDefault()` on Tab:** Prevents focus from moving to the next element. The spec says "Tab dismisses without selecting" — the user must be able to tab away naturally.
- **Setting `highlightedIndex` to 0 on open:** The initial state should be `-1` (nothing highlighted). Immediately focusing index 0 would trigger Enter to select before the user has navigated — contradicts expected UX where Enter without navigation does nothing.
- **Showing dropdown when query < 2 chars:** The debounce guard already handles this, but the dropdown state must also be cleared when the user deletes back below 2 characters.
- **Forgetting to reset `highlightedIndex` on new results:** If the user types quickly and gets new results, the index could point past the end of the new shorter list. Reset to `-1` on every `handleChange` call.
- **Using `dangerouslySetInnerHTML` for highlight:** Introduces XSS risk if city names contain HTML metacharacters. Use JSX split-and-wrap instead.
- **Using button elements inside `<li role="option">`:** WAI-ARIA option role must be on the `<li>` itself, not nested in a `<button>`. Use `onClick` on the `<li>` with keyboard handled on the `<input>`. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/]
- **Debounce at 300ms:** Current code uses 300ms. AUTO-01 requires 200ms. This is a correctness bug in the current SearchBar that must be fixed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AbortController for fetch cancellation | Custom promise-cancellation wrapper | Native `AbortController` + `fetch signal` | Browser native, zero overhead, already used in `src/lib/weatherapi.ts` [VERIFIED: codebase] |
| Stable IDs for ARIA | `useRef` counter, `Math.random()` | `useId()` from React 19 | SSR-safe, collision-free, already in React version installed [VERIFIED: react exports] |
| Debounce logic | External `use-debounce` library | `useRef<ReturnType<typeof setTimeout>>` + `clearTimeout` | Already exists in SearchBar.tsx skeleton — just needs AbortController added |
| Prefix highlight | `react-highlight-words`, `dangerouslySetInnerHTML` | JSX `String.slice()` + `<strong>` | 5 lines of code, zero deps, zero XSS risk |
| Click-outside detection | Portals, `document.body` event delegation | `containerRef` + `mousedown` on `document` | Already implemented in current SearchBar.tsx [VERIFIED: codebase] |

**Key insight:** Every "solved problem" in this phase is already solved inline in the codebase or is a trivial JSX pattern. Installing npm packages for any of these would add build surface for zero functional benefit.

---

## Common Pitfalls

### Pitfall 1: Debounce timing mismatch
**What goes wrong:** Fetch fires after 300ms instead of 200ms; AUTO-01 test fails.
**Why it happens:** Current SearchBar.tsx has `}, 300)` hardcoded. The requirement is 200ms.
**How to avoid:** Change the literal to `200` in the rewrite. Document it with a comment: `// AUTO-01: 200ms debounce`.
**Warning signs:** If you copy the existing SearchBar code without changing this value.

### Pitfall 2: Stale AbortController reference
**What goes wrong:** Old fetch continues to update state after a new query has started; rapid typing produces out-of-order results.
**Why it happens:** The controller is created outside the `setTimeout` callback or not stored in a `useRef`.
**How to avoid:** Create the `AbortController` inside the `setTimeout` callback body. Store it in `abortRef.current` immediately. Before the next debounce fires, abort `abortRef.current`.
**Warning signs:** Two fetch requests visible in DevTools Network for the same input sequence; results flash between values.

### Pitfall 3: `highlightedIndex` pointing past end of results
**What goes wrong:** Pressing Enter selects `undefined` (or throws); `aria-activedescendant` points to a non-existent id.
**Why it happens:** User navigates down to index 3, then input changes, new results have only 2 items; index is not reset.
**How to avoid:** Call `setHighlightedIndex(-1)` inside `handleChange` on every input change, before scheduling the debounce.
**Warning signs:** TypeScript will not catch this — it's a runtime index-out-of-bounds.

### Pitfall 4: `aria-activedescendant` with wrong id format
**What goes wrong:** Screen readers cannot track the highlighted option; accessibility fails.
**Why it happens:** `aria-activedescendant` value does not match the `id` on the `<li>` exactly.
**How to avoid:** Use `useId()` as the base, derive option ids as `${baseId}-option-${i}`, and use the same derivation formula in both `aria-activedescendant` on the `<input>` and `id` on each `<li>`.
**Warning signs:** Chrome accessibility inspector shows `aria-activedescendant` pointing to a missing element.

### Pitfall 5: Tab key `preventDefault` traps focus
**What goes wrong:** Pressing Tab while dropdown is open does not move focus to the next page element; user is stuck.
**Why it happens:** `e.preventDefault()` called in the Tab case of `handleKeyDown`.
**How to avoid:** In the Tab case: update state (`setShowDropdown(false)`, `setHighlightedIndex(-1)`) but do NOT call `e.preventDefault()`.
**Warning signs:** Manual keyboard test: Tab does not advance focus past the search input.

### Pitfall 6: `<button>` inside `<li role="option">`
**What goes wrong:** ARIA conformance failure; some screen readers double-announce or ignore the option.
**Why it happens:** Phase 03's SearchBar used `<button>` inside `<li>` for click handling. This was fine without ARIA roles, but `role="option"` inside `role="listbox"` must be directly on the `<li>` — the `<button>` breaks the ownership chain.
**How to avoid:** Remove the `<button>` wrapper. Handle click with `onMouseDown` on the `<li>` (use `onMouseDown` not `onClick` to fire before the input's `onBlur` would close the dropdown). Set `tabIndex={-1}` on the `<li>` so it's not in the tab sequence.
**Warning signs:** `mousedown` vs `click` order — `onClick` fires after `onBlur`. If the input blurs on mouse-press, the dropdown closes before `onClick` fires. `onMouseDown` fires before blur, catching the selection.

### Pitfall 7: Dropdown closes on `onBlur` instead of `mousedown`
**What goes wrong:** User clicks a suggestion; input `onBlur` fires, closes dropdown, `onClick` on the suggestion never fires.
**Why it happens:** Using `onClick` + a `onBlur` close handler on the input. `onBlur` fires before `onClick` in the browser event order.
**How to avoid:** Current code correctly uses `document.addEventListener('mousedown', ...)` with `containerRef.contains()` check — this is the right pattern. Do not add an `onBlur` handler. Keep `mousedown` on `document` (already in existing code).

---

## Code Examples

### Complete AbortController + debounce integration

```typescript
// Source: Combined pattern from weatherapi.ts (AbortController) + SearchBar.tsx (debounce skeleton)
// Verified against: https://svarden.se/post/debounced-fetch-with-abort-controller

const abortRef = useRef<AbortController | null>(null)
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const val = e.target.value
  setQuery(val)
  setHighlightedIndex(-1)  // reset on every change
  setDuplicateError(false)

  if (debounceRef.current) clearTimeout(debounceRef.current)
  if (abortRef.current) abortRef.current.abort()

  if (val.length < 2) {
    setResults([])
    setShowDropdown(false)
    return
  }

  debounceRef.current = setTimeout(async () => {
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch(
        `/api/v1/cities/search?q=${encodeURIComponent(val)}`,
        { signal: controller.signal }
      )
      if (res.ok) {
        const data: CityEntry[] = await res.json()
        setResults(data)
        setShowDropdown(true)  // show even if empty (for "no results" message)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }, 200) // AUTO-01: 200ms
}
```

### Complete ARIA markup skeleton

```typescript
// Source: WAI-ARIA APG Combobox pattern https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

const listboxId = useId()
const getOptionId = (i: number) => `${listboxId}-opt-${i}`

<div ref={containerRef} className="relative w-full max-w-md">
  <input
    role="combobox"
    aria-expanded={showDropdown}
    aria-controls={listboxId}
    aria-autocomplete="list"
    aria-activedescendant={
      highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined
    }
    type="text"
    value={query}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    // ... existing className
  />

  {showDropdown && (
    <ul
      role="listbox"
      id={listboxId}
      className="absolute z-10 mt-1 w-full ..."
    >
      {results.length === 0 ? (
        <li role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500">
          No cities found for &apos;{query}&apos;
        </li>
      ) : (
        results.map((r, i) => (
          <li
            key={r.id}
            role="option"
            id={getOptionId(i)}
            aria-selected={i === highlightedIndex}
            tabIndex={-1}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
            className={`px-4 py-2 text-sm text-gray-800 cursor-pointer ${
              i === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
            } ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {formatSuggestion(r, query)}
          </li>
        ))
      )}
    </ul>
  )}
</div>
```

### TailwindCSS v4 styling notes

TailwindCSS v4 is CSS-first — no `tailwind.config.ts` exists in this project (confirmed). All class names are standard utilities. The existing `globals.css` uses `@import "tailwindcss"` which loads all v4 utilities. No custom theme file is needed for this phase.

Relevant classes confirmed working in this project's existing components:
- Positioning: `relative`, `absolute`, `z-10` — used in current SearchBar dropdown
- Focus states: `focus:ring-2`, `focus:ring-white/50` — used on current `<input>`
- Highlight state: `bg-blue-100` for highlighted item, `hover:bg-blue-50` for hover
- `focus-visible:` prefix works in v4 for keyboard-only focus styles [CITED: https://tailwindcss.com/docs/hover-focus-and-other-states]

[ASSUMED: `focus-visible:` prefix available in TailwindCSS v4 without explicit plugin — based on v4 docs claims; not tested against this specific build]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `onBlur` to close dropdown | `document.mousedown` + `containerRef.contains()` | Standard since React 16 | Prevents click-before-blur race; already in SearchBar |
| `Math.random()` or counter for ARIA ids | `useId()` from React | React 18 | SSR-safe, stable across renders |
| `dangerouslySetInnerHTML` for highlight | JSX `String.slice()` + `<strong>` | Always correct | Zero XSS risk |
| Library debounce (`lodash.debounce`) | Inline `useRef` + `setTimeout` | Standard practice for simple cases | Zero deps |

**Deprecated/outdated:**
- `serverComponentsExternalPackages`: use `serverExternalPackages` (Next.js 15+) — already done in Phase 02
- `react-highlight-words`: valid library but overkill for single prefix-match use case

---

## Current SearchBar Gap Analysis

| Feature | Status | Action Required |
|---------|--------|-----------------|
| Prop signature (`cities: CityEntry[]`, `onAddCity`) | DONE | None |
| Debounce skeleton (`debounceRef`, `clearTimeout`) | DONE (wrong timing) | Change 300 → 200ms |
| Click-outside handler | DONE | None |
| Basic dropdown render | DONE | Upgrade to ARIA roles |
| AbortController | MISSING | Add `abortRef`, abort on each change |
| Keyboard ↑/↓ navigation | MISSING | Add `highlightedIndex` state + key cases |
| Enter selects highlighted | MISSING | Add Enter case in `handleKeyDown` |
| Tab dismisses (no select) | MISSING | Add Tab case in `handleKeyDown` |
| ARIA combobox markup | MISSING | Add `role`, `aria-*` attributes |
| "No cities found for '{input}'" | PARTIAL | Currently shows "No cities found" (missing `for '{input}'` part) |
| Prefix highlight in suggestions | MISSING | Add `HighlightMatch` helper |
| `useId` for option ids | MISSING | Add for `aria-activedescendant` |
| `onMouseDown` on list items | MISSING | Replace `<button onClick>` with `<li onMouseDown>` |

---

## Plan Decomposition Recommendation

**Recommended: 1 plan (single SearchBar rewrite)**

Rationale: All changes land in `src/components/SearchBar.tsx` only. The file is 116 lines. The rewrite is ~180 lines. Splitting into multiple plans would create artificial wave dependencies between changes within the same file. A single plan can be executed atomically and verified in one pass.

**Wave structure:**
- Wave 1 (only wave): rewrite `SearchBar.tsx` — all 4 AUTO requirements in one plan

**Verification:** TypeScript compile-clean + manual browser test against the 4 success criteria.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Project has implicit lean-deps posture — no UI component libraries intended | Standard Stack | Low risk — even if false, no library is needed here; inline code is objectively simpler |
| A2 | `focus-visible:` prefix works in TailwindCSS v4 without plugin | Code Examples | Low risk — if unavailable, plain `focus:` is the fallback already used in existing components |

---

## Open Questions (RESOLVED)

1. **Should highlighting apply to the full formatted string or city name only?**
   - What we know: AUTO-04 says "The characters the user typed appear bold in each suggestion row, making the prefix match visually distinct." The API does prefix matching on `name LIKE ?%`.
   - What's unclear: If user types "Ban" and result is "Bangkok, Bangkok, Thailand" — should only "Ban" in "Bangkok" be bold, or should "Ban" also be highlighted if it appears in region/country?
   - Recommendation: Bold city name prefix only. The SQLite query matches on `name`, so the prefix is always in the city name portion. Highlighting region/country would be misleading.

2. **Should Enter without keyboard navigation (index = -1) do anything?**
   - What we know: Requirement says "Enter adds the highlighted city." If nothing is highlighted (index -1), strictly the requirement does not require action.
   - Recommendation: When `highlightedIndex === -1`, Enter is a no-op. This matches expected UX for comboboxes — Enter submits only when the user has navigated to a suggestion.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 04 is purely a client-component code change. No new external tools, databases, runtimes, or CLI utilities beyond the existing project stack. All dependencies installed. No new `npm install` required.

---

## Validation Architecture

`workflow.nyquist_validation` not explicitly set to `false` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — no jest/vitest/playwright detected in project |
| Config file | None — Wave 0 gap |
| Quick run command | `npx tsc --noEmit` (TypeScript compile check — fastest available) |
| Full suite command | Manual browser checklist (no automated test runner present) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | Debounce 200ms + AbortController on rapid type | manual-only | — | N/A |
| AUTO-02 | 8 suggestions in correct format; "No cities found" message | manual-only | — | N/A |
| AUTO-03 | ↑↓/Enter/Escape/Tab keyboard behavior | manual-only | — | N/A |
| AUTO-04 | Prefix bold in suggestion text | manual-only | — | N/A |

All AUTO requirements are UI interaction behaviors that require a running browser. No automated command can verify them without a test runner and DOM environment. TypeScript compile clean is the only automated gate.

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (TypeScript clean)
- **Per wave merge:** Same
- **Phase gate:** `npx tsc --noEmit` green + manual browser checklist against 4 success criteria

### Wave 0 Gaps

- [ ] No test runner installed — manual browser verification is the only validation path for this phase. Acceptable for a UI-only phase without existing test infrastructure.

*(No automated test framework exists in the project — confirmed by absence of jest.config.*, vitest.config.*, pytest.ini, and test/ directories. This is consistent with prior phases which also used TypeScript compile + manual browser testing.)*

---

## Security Domain

This phase adds no authentication, session handling, data persistence, or server-side logic. All changes are in a client component that calls an existing, already-secured server route.

Relevant to this phase:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Partial | Query is `encodeURIComponent(val)` before fetch; server validates via `validateSearchQuery` (already in Phase 03 route) |
| V6 Cryptography | No | N/A |
| V2 Authentication | No | N/A |

**XSS risk in highlight:** Mitigated by JSX rendering (no `dangerouslySetInnerHTML`). React escapes city names as text nodes. No sanitization library needed.

---

## Sources

### Primary (HIGH confidence)
- `src/components/SearchBar.tsx` — current implementation, confirmed via Read tool
- `src/app/api/v1/cities/search/route.ts` — confirmed API contract (CityEntry[], LIMIT 8, population DESC)
- `package.json` — confirmed installed versions (React 19.2.4, Next.js 16.2.6, TailwindCSS ^4)
- `node_modules/react` — confirmed `useId`, `useRef`, `useState`, `useEffect` exports
- [WAI-ARIA APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — keyboard interactions and ARIA roles
- `src/lib/weatherapi.ts` — AbortController pattern already established in codebase

### Secondary (MEDIUM confidence)
- [Debounced fetch with AbortController — svarden.se](https://svarden.se/post/debounced-fetch-with-abort-controller) — confirms combined debounce+abort pattern
- [TailwindCSS Hover, Focus, and Other States](https://tailwindcss.com/docs/hover-focus-and-other-states) — `focus-visible:` prefix
- [React highlight text without XSS — DEV Community](https://dev.to/_martinwheeler_/create-a-react-search-bar-that-highlights-your-results-4hdh) — JSX split-and-wrap approach

### Tertiary (LOW confidence)
- None — all critical claims verified against codebase or official sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and node_modules
- Architecture: HIGH — all patterns derived from existing codebase + W3C spec
- Pitfalls: HIGH — identified from code inspection (300ms bug, button-in-li, Tab preventDefault)
- ARIA patterns: HIGH — cited from W3C WAI-ARIA APG (authoritative source)

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable domain — React, ARIA, TailwindCSS v4 all stable)
