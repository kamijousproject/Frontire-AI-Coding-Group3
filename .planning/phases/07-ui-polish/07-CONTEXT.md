# Phase 07: UI Polish — Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the 3 UI audit gaps identified in the v1.1 UI-REVIEW.md (score 18/24):
- UI-01: Add a "Searching…" loading indicator to SearchBar during the debounce fetch window
- UI-02: Add `aria-label="Search for a city"` to the SearchBar `<input>` element
- UI-03: Change `font-semibold` → `font-bold` in `WeatherCard.tsx` (line 37, city name)

All three changes are confined to `src/components/SearchBar.tsx` and `src/components/WeatherCard.tsx`. No new components, no API changes, no type changes.

</domain>

<decisions>
## Implementation Decisions

### Loading Indicator Style (UI-01)
- **D-01:** Use a `"Searching…"` text row inside the dropdown — same `<li>` structure as the "No cities found" empty-state row. No new spinner element needed. Reuses existing pattern: `role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500"`.
- **D-02:** Add an `isLoading` boolean state to `SearchBar`. Set `isLoading = true` AND `showDropdown = true` inside the `setTimeout` callback body, immediately before the `fetch()` call. This matches the requirement: "from the moment the 200ms debounce timer fires".
- **D-03:** Set `isLoading = false` in the `finally` block of the fetch (covers both success and error paths). On abort (`AbortError` catch), do NOT set `isLoading = false` — the new debounce timer will set it true again, keeping the spinner visible without flicker.
- **D-04:** When `isLoading` is true and `showDropdown` is true, render the "Searching…" row instead of the results list or empty state. Priority: `isLoading` → "Searching…" / `results.length === 0` → "No cities found" / else → results list.

### Dropdown Open-on-Loading (UI-01)
- **D-05:** The dropdown opens when `isLoading` becomes true (inside the `setTimeout` callback). Before the timer fires, the dropdown stays hidden — consistent with current behavior where nothing shows until a response arrives.
- **D-06:** On abort (rapid typing), `isLoading` stays `true` (not reset to false). The spinner remains visible across cancellations until the final fetch resolves. This prevents the dropdown from flickering closed and reopening between keystrokes.

### aria-label (UI-02)
- **D-07:** Add `aria-label="Search for a city"` to the `<input>` element in `SearchBar.tsx`. No other changes — the input already has `role="combobox"`, `aria-expanded`, `aria-controls`, and `aria-autocomplete` attributes.

### Font Weight Fix (UI-03)
- **D-08:** Change `font-semibold` → `font-bold` on the city name `<p>` element in `WeatherCard.tsx` (currently line 37). This is the only `font-semibold` occurrence in the file.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation targets
- `src/components/SearchBar.tsx` — Full file read required. The `isLoading` state and `showDropdown` logic live here. Key locations: `useState` imports (line 3), debounce handler (lines 81–98), dropdown render (lines 168–200).
- `src/components/WeatherCard.tsx` — Line 37: `font-semibold` to change to `font-bold`.

### Requirements
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03 in the "UI Polish" section.

### UI audit reference
- `.planning/milestones/v1.1-phases/04-autocomplete-ui/04-UI-REVIEW.md` — Original audit findings that defined these 3 gaps (score 18/24).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Empty-state `<li>` row in `SearchBar.tsx:174–180` — `role="option" aria-disabled="true" className="px-4 py-2 text-sm text-gray-500"`. The "Searching…" row should use this exact same structure and class.
- `isLoading` state: add alongside existing `useState` hooks at lines 37–41.

### Established Patterns
- AbortController on abort → do NOT update state (lines 95–96: `if (err instanceof Error && err.name === 'AbortError') return`). Loading state must follow the same rule — no `setIsLoading(false)` in the AbortError catch.
- `setShowDropdown(true)` currently lives at line 92 (inside the `if (res.ok)` block). It must also be called at the top of the `setTimeout` callback (line 81), before the `fetch()`, to open the dropdown during loading.

### Integration Points
- No integration with other components — both changes are self-contained within their respective files.
- TypeScript: `isLoading` is `boolean`, initial value `false`. No type changes required.

</code_context>

<specifics>
## Specific Ideas

- "Searching…" text chosen over spinner — reuses the exact same `<li>` pattern as the empty state, zero new CSS. Consistent with existing typography in the dropdown.
- `isLoading` stays `true` on abort to prevent flicker — this is a deliberate UX choice, not a bug. The spinner is a continuous indicator until the final response.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-ui-polish*
*Context gathered: 2026-05-13*
