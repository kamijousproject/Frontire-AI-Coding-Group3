# Phase 04: Autocomplete UI - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 1 (SearchBar.tsx — single file modified)
**Analogs found:** 5 / 6 pattern categories (all have codebase or spec-derived analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/SearchBar.tsx` | component | request-response (debounced) | `src/hooks/useWeather.ts` (fetch + cancel pattern) | role-partial / data-exact |

---

## Pattern Assignments

### `src/components/SearchBar.tsx` (component, debounced request-response)

**Analog:** `src/hooks/useWeather.ts` (fetch cancellation via `cancelled` flag) +
`src/components/SearchBar.tsx` lines 17–55 (existing debounce skeleton)

The existing file is 116 lines and already provides the correct prop signature, debounce
skeleton, click-outside handler, and basic dropdown render. The rewrite preserves all of
these and fills the six gaps identified in RESEARCH.md. Patterns are organized below by
gap, with the codebase analog and the exact excerpt to copy or adapt.

---

### Pattern 1: AbortController + debounce (AUTO-01)

**Gap:** Current `handleChange` fetches at 300ms with no cancellation of in-flight requests.
**Analog:** `src/hooks/useWeather.ts` lines 24 and 64 (cancelled flag pattern) +
`src/components/SearchBar.tsx` lines 18, 36–55 (debounceRef skeleton).

**Existing debounce skeleton to preserve** (`src/components/SearchBar.tsx` lines 18, 36–44):
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// inside handleChange:
if (debounceRef.current) clearTimeout(debounceRef.current)

if (val.length < 2) {
  setResults([])
  setShowDropdown(false)
  return
}

debounceRef.current = setTimeout(async () => {
```

**Add alongside it — new `abortRef` declaration:**
```typescript
// Line to add next to debounceRef (SearchBar.tsx, after line 18):
const abortRef = useRef<AbortController | null>(null)
```

**Replace the fetch block** (SearchBar.tsx lines 44–55) with:
```typescript
debounceRef.current = setTimeout(async () => {
  const controller = new AbortController()
  abortRef.current = controller          // store INSIDE the callback, not outside
  try {
    const res = await fetch(
      `/api/v1/cities/search?q=${encodeURIComponent(val)}`,
      { signal: controller.signal }
    )
    if (res.ok) {
      const data: CityEntry[] = await res.json()
      setResults(data)
      setShowDropdown(true)              // show even when empty — "no results" message
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return  // expected cancellation
    // other errors: silent — search is non-critical
  }
}, 200)  // AUTO-01: 200ms (current code has 300ms — must change)
```

**Abort the previous controller at the top of handleChange** (before the setTimeout):
```typescript
if (debounceRef.current) clearTimeout(debounceRef.current)
if (abortRef.current) abortRef.current.abort()   // cancel in-flight fetch
```

**Analog for AbortError guard** — `useWeather.ts` uses a `cancelled` boolean flag (line 64:
`return () => { cancelled = true }`) for the same purpose: preventing stale state updates.
The AbortController approach is the fetch-native equivalent; `err.name === 'AbortError'` is
the signal that the abort was intentional.

**Critical: controller must be created inside the setTimeout callback.** If created outside,
aborting on the next keypress aborts the controller before the fetch even starts.

---

### Pattern 2: Highlighted index state for keyboard navigation (AUTO-03)

**Gap:** Only Escape is handled today (SearchBar.tsx line 59). Full ↑/↓/Enter/Tab required.
**Analog:** No existing keyboard nav in codebase — pattern sourced from WAI-ARIA APG
(authoritative spec, cited in RESEARCH.md).

**New state declaration** (add to existing useState block):
```typescript
const [highlightedIndex, setHighlightedIndex] = useState(-1)
// -1 = nothing highlighted; reset on every handleChange call
```

**Reset on input change** (add inside handleChange, immediately after `setDuplicateError(false)`):
```typescript
setHighlightedIndex(-1)  // prevent stale index pointing past new results list
```

**Replace current `handleKeyDown`** (SearchBar.tsx lines 58–60):
```typescript
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (!showDropdown) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()                              // prevent page scroll
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
      // index -1: Enter is a no-op (user has not navigated to a suggestion)
      break
    case 'Escape':
      setShowDropdown(false)
      setHighlightedIndex(-1)
      break
    case 'Tab':
      setShowDropdown(false)
      setHighlightedIndex(-1)
      // NO e.preventDefault() — Tab must move focus to next element naturally
      break
  }
}
```

---

### Pattern 3: ARIA combobox markup (AUTO-03)

**Gap:** No ARIA roles on current input or dropdown list.
**Analog:** No existing ARIA combobox in codebase. Pattern from WAI-ARIA APG combobox
example (authoritative spec, cited in RESEARCH.md §Pattern 3).

**New imports** — add `useId` to existing React import (SearchBar.tsx line 3):
```typescript
import { useState, useRef, useEffect, useId } from 'react'
```

**New id helpers** (declare after state declarations):
```typescript
const listboxId = useId()                          // React 19 — SSR-safe, collision-free
const getOptionId = (i: number) => `${listboxId}-opt-${i}`
```

**ARIA attributes on `<input>`** — replace existing input element (SearchBar.tsx lines 80–87):
```typescript
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
  placeholder="Search for a city..."
  className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
/>
```

**ARIA attributes on `<ul>`** — replace existing ul (SearchBar.tsx line 94):
```typescript
<ul
  role="listbox"
  id={listboxId}
  className="absolute z-10 mt-1 w-full rounded-lg border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm"
>
```

**`aria-activedescendant` must exactly match `id` on the `<li>`.** Use the same
`getOptionId(i)` formula in both places — any mismatch silently breaks screen readers.

---

### Pattern 4: `<li onMouseDown>` replacing `<button onClick>` (AUTO-03 / ARIA)

**Gap:** Current suggestions use `<button>` inside `<li>` (SearchBar.tsx lines 100–109).
WAI-ARIA requires `role="option"` directly on the `<li>`; nesting a `<button>` breaks
the ownership chain. Also: `onClick` fires after `onBlur`, so the dropdown would close
before the click registers.
**Analog:** The existing `containerRef` mousedown handler (SearchBar.tsx lines 22–28)
already demonstrates the `mousedown` event order insight — `mousedown` fires before blur.

**Replace `results.map(...)` block** (SearchBar.tsx lines 98–110) with:
```typescript
results.map((r, i) => (
  <li
    key={r.id}
    role="option"
    id={getOptionId(i)}
    aria-selected={i === highlightedIndex}
    tabIndex={-1}                                   // out of tab sequence; keyboard via input
    onMouseDown={(e) => {
      e.preventDefault()                            // prevent input blur before selection fires
      if (!isFull) handleSelect(r)
    }}
    className={`w-full px-4 py-2 text-left text-sm text-gray-800 cursor-pointer
      ${i === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'}
      ${isFull ? 'cursor-not-allowed opacity-50' : ''}`}
  >
    {formatSuggestion(r, query)}
  </li>
))
```

**Why `onMouseDown` with `e.preventDefault()`:** `preventDefault()` on mousedown prevents
the input from losing focus, keeping the dropdown open long enough for the selection to
register. The `document.addEventListener('mousedown', ...)` click-outside handler in the
existing code already uses this same event ordering correctly.

---

### Pattern 5: Prefix highlight JSX helper (AUTO-04)

**Gap:** Suggestion rows currently render plain text (SearchBar.tsx line 107).
**Analog:** No existing highlight helper in codebase. Pattern is pure JSX — no library.

**New helper component** (declare before the `SearchBar` function):
```typescript
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
```

**New format helper** (declare after `HighlightMatch`):
```typescript
function formatSuggestion(city: CityEntry, query: string): React.ReactNode {
  // Highlight applies to city name only — SQLite LIKE matches on name column
  const suffix = city.region ? `, ${city.region}, ${city.country}` : `, ${city.country}`
  return (
    <>
      <HighlightMatch text={city.name} query={query} />
      {suffix}
    </>
  )
}
```

**XSS safety:** Both helpers use JSX children, not `innerHTML`. React renders city names
as text nodes — all HTML metacharacters are escaped automatically. No sanitization library
needed.

**Do not highlight region or country:** The SQLite query (`name LIKE ?%`) matches on the
`name` column only. Bolding characters in region/country strings would be misleading.

---

### Pattern 6: CityEntry type usage

**Source:** `src/types/weather.ts` lines 63–71.
**Already correct** in current SearchBar.tsx (line 4 import, lines 7–8 props, line 48 cast).
No changes needed to type usage. For reference:

```typescript
// src/types/weather.ts lines 63–71
export interface CityEntry {
  id: number;
  name: string;
  country: string;
  region: string | null;    // null-safe: use `city.region ? ...` not `city.region &&`
  lat: number;
  lon: number;
  timezone: string;
}
```

**`region` is `string | null`**, not `string | undefined`. The existing guard
`r.region ? \`, ${r.region}\` : ''` (SearchBar.tsx line 107) is correct and must be
preserved in `formatSuggestion`.

**API contract:** `src/app/api/v1/cities/search/route.ts` returns `CityEntry[]` directly
from SQLite (`SELECT id, name, country, region, lat, lon, timezone FROM cities LIMIT 8`).
The shape is exact — no mapping layer needed on the client.

---

### Pattern 7: "No cities found for '{input}'" empty state (AUTO-02)

**Gap:** Current empty state renders "No cities found" without the query string
(SearchBar.tsx line 96). Requirement specifies exact string with query interpolated.
**Analog:** Same `<li>` element in current code — only the text content changes.

**Replace current empty-state `<li>`** (SearchBar.tsx line 96):
```typescript
// Current (wrong):
<li className="px-4 py-2 text-sm text-gray-500">No cities found</li>

// Replace with:
<li
  role="option"
  aria-disabled="true"
  className="px-4 py-2 text-sm text-gray-500"
>
  No cities found for &apos;{query}&apos;
</li>
```

**`showDropdown` must remain `true` when results are empty** so this message is visible.
The new `handleChange` sets `setShowDropdown(true)` unconditionally on a successful fetch
response — the empty state is handled inside the `<ul>`, not by hiding the dropdown.

---

## Shared Patterns

### Fetch cancellation
**Source:** `src/hooks/useWeather.ts` lines 24, 64
**Apply to:** AbortController in `handleChange`

The `cancelled` flag pattern in `useWeather.ts`:
```typescript
// useWeather.ts lines 24, 64
let cancelled = false
// ...
return () => { cancelled = true }
```

SearchBar uses the fetch-native equivalent (`AbortController` + `signal`) which also
prevents stale state updates but additionally cancels the in-flight network request,
saving bandwidth on rapid typing. The guard `if (err.name === 'AbortError') return`
plays the same role as `if (cancelled) return` in useWeather.

### Ref-based mutable state (no re-render on change)
**Source:** `src/hooks/useWeather.ts` line 13 + `src/components/SearchBar.tsx` lines 17–19
**Apply to:** `abortRef`, `debounceRef`, `dupTimerRef`

```typescript
// Pattern: useRef for values that change but should not trigger re-renders
// useWeather.ts line 13:
const retryCount = useRef<Map<string, number>>(new Map())
// SearchBar.tsx lines 18–19 (existing):
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

`abortRef` follows the same pattern — it holds the current controller but changing it
must not cause a render cycle.

### Click-outside handler
**Source:** `src/components/SearchBar.tsx` lines 21–29 (preserve as-is)

```typescript
// Already correct — do not modify:
useEffect(() => {
  function handleMouseDown(e: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }
  document.addEventListener('mousedown', handleMouseDown)
  return () => document.removeEventListener('mousedown', handleMouseDown)
}, [])
```

This uses `mousedown` (not `click`) which fires before `onBlur` — the same event ordering
reason that `<li onMouseDown>` is used for selections. Do not replace with `onBlur`.

### Duplicate city error + auto-dismiss timer
**Source:** `src/components/SearchBar.tsx` lines 15, 19, 64–68 (preserve as-is)

```typescript
// Already correct — do not modify:
const [duplicateError, setDuplicateError] = useState(false)
const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

if (cities.some((c) => c.id === result.id)) {
  setDuplicateError(true)
  if (dupTimerRef.current) clearTimeout(dupTimerRef.current)
  dupTimerRef.current = setTimeout(() => setDuplicateError(false), 3000)
  return
}
```

---

## No Analog Found

| Pattern | Reason |
|---------|--------|
| ARIA combobox markup | No existing ARIA combobox in codebase; pattern from WAI-ARIA APG spec |
| Keyboard ↑/↓ navigation | No existing keyboard-navigable list in codebase; pattern from WAI-ARIA APG spec |

Both are well-specified by the W3C WAI-ARIA APG (cited in RESEARCH.md). The RESEARCH.md
patterns (§Pattern 2, §Pattern 3) are the authoritative source for these two items.

---

## Preserved Code (Do Not Modify)

The following sections of the current SearchBar.tsx are correct and must survive the rewrite
without change:

| Lines | What | Why |
|-------|------|-----|
| 1 | `'use client'` | Required — component uses hooks and browser APIs |
| 6–9 | `SearchBarProps` interface | Prop signature correct; `page.tsx` wiring is complete |
| 11 | Function signature | Correct |
| 15–16 | `query`, `results`, `showDropdown`, `duplicateError` state | All still needed |
| 17 | `containerRef` | Used by click-outside handler |
| 21–29 | Click-outside `useEffect` | Correct mousedown pattern — do not change to onBlur |
| 62–74 | `handleSelect` body | Duplicate check, 10-city cap, clear-on-select all correct |
| 76 | `const isFull` | Still needed |
| 79 | `<div ref={containerRef}>` outer wrapper | Correct |
| 86 | Input className | Correct Tailwind classes — preserve |
| 89–91 | Duplicate error `<p>` | Correct |

---

## Summary of Changes to SearchBar.tsx

| Change | Type | Lines Affected |
|--------|------|----------------|
| Add `useId` to React import | modify | 3 |
| Add `highlightedIndex` state | add | after line 16 |
| Add `abortRef` | add | after line 18 |
| Add `listboxId`, `getOptionId` helpers | add | after refs |
| Add `HighlightMatch` component | add | before SearchBar fn |
| Add `formatSuggestion` helper | add | before SearchBar fn |
| `handleChange`: add abort + reset index + fix 300→200ms | modify | 31–55 |
| `handleKeyDown`: add ↑/↓/Enter/Tab cases | replace | 58–60 |
| `<input>`: add `role`, `aria-*` attributes | modify | 80–87 |
| `<ul>`: add `role="listbox"` and `id` | modify | 94 |
| Empty state `<li>`: add `role`, `aria-disabled`, fix text | modify | 96 |
| Result `<li>`: replace `<button>` with ARIA `<li onMouseDown>` | replace | 98–110 |

**Estimated rewrite size:** ~185 lines (from 116 lines today).

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/app/api/v1/`
**Files read:** 5 (SearchBar.tsx, useWeather.ts, weather.ts types, cities/search/route.ts, 04-RESEARCH.md)
**Pattern extraction date:** 2026-05-12
