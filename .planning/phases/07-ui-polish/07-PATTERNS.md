# Phase 07: UI Polish - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 2
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/SearchBar.tsx` | component | request-response | `src/components/SearchBar.tsx` (self — surgical edits) | exact |
| `src/components/WeatherCard.tsx` | component | request-response | `src/components/WeatherCard.tsx` (self — single token change) | exact |

---

## Pattern Assignments

### `src/components/SearchBar.tsx` (component, request-response)

**Analog:** self — all patterns are already present in this file; changes extend existing conventions.

**Existing `useState` block to extend** (lines 37–41):
```tsx
const [query, setQuery] = useState('')
const [results, setResults] = useState<CityEntry[]>([])
const [showDropdown, setShowDropdown] = useState(false)
const [duplicateError, setDuplicateError] = useState(false)
const [highlightedIndex, setHighlightedIndex] = useState(-1)
```
Add `isLoading` immediately after line 41, matching the existing pattern:
```tsx
const [isLoading, setIsLoading] = useState(false)
```

**Debounce callback — where to set `isLoading = true` and open dropdown** (lines 81–98):
```tsx
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
      setShowDropdown(true)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    // other errors: silent — search is non-critical
  }
}, 200) // AUTO-01: 200ms debounce
```
Target insertion points inside the callback:
- Line 82 (top of callback body, before `const controller`): insert `setIsLoading(true)` and `setShowDropdown(true)`.
- After the `if (res.ok)` block closes (after `setShowDropdown(true)` on line 92): add a `finally` block containing `setIsLoading(false)`.
- The existing AbortError guard (line 95: `if (err instanceof Error && err.name === 'AbortError') return`) must NOT call `setIsLoading(false)` — matches the established abort-guard pattern.

**Empty-state `<li>` — the template to reuse for "Searching…"** (lines 174–181):
```tsx
{results.length === 0 ? (
  <li
    role="option"
    aria-disabled="true"
    className="px-4 py-2 text-sm text-gray-500"
  >
    No cities found for &apos;{query}&apos;
  </li>
) : (
```
The "Searching…" row uses the identical `<li>` structure and class set. Only the text content differs:
```tsx
<li
  role="option"
  aria-disabled="true"
  className="px-4 py-2 text-sm text-gray-500"
>
  Searching…
</li>
```

**Dropdown render priority** (lines 168–200):
Current logic: `showDropdown` → `results.length === 0` (empty state) OR results list.
New logic: `showDropdown` → `isLoading` → "Searching…" / `results.length === 0` → "No cities found" / else → results list.
```tsx
{showDropdown && (
  <ul role="listbox" id={listboxId} className="...">
    {isLoading ? (
      <li role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500">
        Searching…
      </li>
    ) : results.length === 0 ? (
      <li role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500">
        No cities found for &apos;{query}&apos;
      </li>
    ) : (
      results.map((r, i) => ( ... ))
    )}
  </ul>
)}
```

**`aria-label` insertion point** (lines 150–162):
```tsx
<input
  type="text"
  role="combobox"
  aria-expanded={showDropdown}
  aria-controls={listboxId}
  aria-autocomplete="list"
  aria-activedescendant={highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined}
  value={query}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  placeholder="Search for a city..."
  className="..."
/>
```
Add `aria-label="Search for a city"` as a new prop after `aria-autocomplete="list"` (line 155), maintaining the existing prop ordering convention (ARIA attrs grouped together before event handlers).

---

### `src/components/WeatherCard.tsx` (component, request-response)

**Analog:** self — single Tailwind class token change on one line.

**Target line** (line 37):
```tsx
<p className="text-lg font-semibold leading-tight">{data.city}</p>
```
Change `font-semibold` to `font-bold`. Resulting line:
```tsx
<p className="text-lg font-bold leading-tight">{data.city}</p>
```

**Context — surrounding font-bold usage in the same file** (line 43):
```tsx
<p className="text-2xl font-bold">{data.temp_c}°C / {data.temp_f}°F</p>
```
`font-bold` is already the established convention for emphasis within `WeatherCard`. The city name should match this convention.

---

## Shared Patterns

### AbortError Guard — do NOT reset loading state on abort
**Source:** `src/components/SearchBar.tsx` lines 94–96
**Apply to:** `isLoading` state management in `SearchBar.tsx`
```tsx
} catch (err) {
  if (err instanceof Error && err.name === 'AbortError') return
  // other errors: silent — search is non-critical
}
```
`setIsLoading(false)` must NOT appear before the early `return` in the AbortError branch. Only the `finally` block (which runs after the catch branch returns) resets loading. This prevents flicker between rapid keystrokes.

### Dropdown `<li>` Structure — empty/disabled row
**Source:** `src/components/SearchBar.tsx` lines 175–180
**Apply to:** "Searching…" row (UI-01)
```tsx
<li
  role="option"
  aria-disabled="true"
  className="px-4 py-2 text-sm text-gray-500"
>
  {content}
</li>
```
Both the empty-state row and the loading row use this exact structure. No new CSS classes.

---

## No Analog Found

None — both files are self-contained edits with clear internal patterns to follow.

---

## Metadata

**Analog search scope:** `src/components/` (both files read in full)
**Files scanned:** 2
**Pattern extraction date:** 2026-05-13
