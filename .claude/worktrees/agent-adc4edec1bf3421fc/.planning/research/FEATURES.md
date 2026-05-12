# Feature Landscape: Local City Autocomplete

**Domain:** Instant type-ahead city search backed by a local SQLite database
**Project:** Frontier AI Weather Dashboard — v1.1 milestone
**Researched:** 2026-05-12
**Confidence:** HIGH (autocomplete UX patterns are mature, stable, and heavily documented across ARIA specs, Nielsen/NNG studies, and major weather app implementations)

---

## Context: What Is Being Added

The existing SearchBar calls weatherapi.com's search endpoint live on every keystroke. The goal is to replace that with a local SQLite database (~5,000 cities) queried server-side via `/api/cities/search`, returning suggestions instantly. The user selects a city from the dropdown; the dashboard then fetches weather using that city's lat/lon. The add-to-dashboard flow is unchanged.

This milestone touches only the search input interaction — no new pages, no new persistence model.

---

## Table Stakes

Features users expect from any city autocomplete in a weather context. Missing any of these makes the product feel broken or unpolished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Trigger after 2 characters | 1-char results are too broad to be useful; 2 chars eliminates most noise while feeling instant | Low | 1 char: hundreds of matches, noisy. 3 chars: small delay in perceived responsiveness. 2 chars is the sweet spot for city search. |
| Debounce at ~200ms | Prevents request flood; does not feel sluggish to users | Low | For a local SQLite hit (sub-10ms query), 150–200ms debounce is correct. 300ms feels slow. 0ms wastes server resources on intermediate keystrokes like "L", "Lo", "Lon", "Lond". |
| Show 5–8 suggestions maximum | Cognitive load: users stop reading after ~5-7 items; long lists cause scroll paralysis | Low | 5 is optimal for city search. 8 is acceptable if a very common prefix hits many cities. Never show more than 8. |
| Keyboard navigation (↑ ↓ Enter Escape) | Expected by keyboard users and power users; also WCAG 2.1 requirement | Medium | Arrow keys move highlight. Enter selects highlighted item. Escape closes dropdown and returns focus to input. Tab should close the dropdown (do not trap focus). |
| Mouse/click selection | Expected by all pointer users | Low | Clicking a suggestion selects it and triggers weather add. |
| Dismiss on click-outside | Standard dropdown behavior | Low | Clicking anywhere outside the suggestion list closes it without selecting. |
| Clear input on dismiss / after selection | After adding a city, the input should clear so the user can search again immediately | Low | Already the expected pattern in the v1.0 SearchBar — preserve it. |
| Highlight matching prefix in suggestion text | Visually confirms "this is why I'm seeing this result" | Low | Bold or highlight the characters the user typed within each suggestion label. Example: user typed "Lon" → suggestion shows **Lon**don. |
| Loading / empty state | If the query returns 0 results, show "No cities found" — not a blank dropdown | Low | A silently disappearing dropdown is a UX dead-end. |
| Accessible markup (role="combobox", role="listbox", aria-activedescendant) | Screen readers, browser autofill suppression, WCAG 2.1 AA | Medium | Use ARIA combobox pattern. Set `autoComplete="off"` on the input to suppress browser suggestions interfering with the custom dropdown. |

---

## Differentiators

Features not universally expected but meaningfully improve the experience for a weather-specific city search. Worth adding if low-effort.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Show city + country in every suggestion | Disambiguates cities with the same name (Springfield US vs Springfield AU) | Low | Country is mandatory for weather context. Without it, "Paris" is ambiguous. |
| Show region/state as secondary line or parenthetical | Further disambiguates within a country (Paris, TX vs Paris, France) | Low | Render as muted secondary text: "Springfield, Illinois, United States". Use region only when non-null — many cities in the DB will have null region. |
| Population-weighted ranking (larger cities first) | "London" should return London UK (9M) before London, Ontario (400k) | Low | Sort by population DESC for same-score prefix matches. This is the single most impactful ranking improvement. |
| Prefix match priority over substring match | "Par" → "Paris" ranks above "Beauparis" — intuitive for city search | Low | In SQLite: `WHERE name LIKE 'Par%'` ranks above `WHERE name LIKE '%Par%'`. Run prefix match first; append non-prefix matches below. |
| Timezone displayed for power users | Useful when adding cities in different time zones; "is this the right London?" | Low | Show as subtle tertiary text: "Europe/London". Only render if non-null. |
| Deduplicate exact name+country pairs | If DB has duplicates (e.g., "London, England" twice), show only one | Low | Group by `(name, country)` or handle in DB seeding phase. |

---

## Anti-Features

Features to explicitly NOT build for this milestone. They add complexity without proportionate value, or actively worsen the experience.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Fuzzy/phonetic matching (Levenshtein, soundex) | High complexity, SQLite has no native fuzzy match — requires custom implementation or FTS5 trigrams. Rarely needed for city search where users know the spelling. | Use prefix match + substring fallback. This covers typos at the end (not the beginning) which is the common case. |
| Client-side filtering of a pre-loaded city list | Downloading 5,000 cities to the client (JSON) to filter in-browser wastes bandwidth (~200-400KB) and defeats the purpose of the SQLite approach. | Keep filtering server-side at `/api/cities/search`. |
| Debounce lower than 150ms | Sub-150ms debounce means nearly every keystroke triggers a server round-trip. With SQLite the query is cheap, but it still adds unnecessary load and can cause out-of-order response races. | 200ms debounce. |
| Showing population as a visible number | "Paris — 2,161,000" is noisy data in a suggestion dropdown. Population informs ranking, not display. | Use population only for server-side sort order. Never show it in the UI. |
| "Search as you type" with 1-character trigger | Single-character queries return 500+ results from a 5,000-city DB. The server has to rank and truncate them anyway. The result list is nearly useless. | Enforce minimum 2 characters in the input handler before firing the query. |
| Typing animation / skeleton loaders for suggestions | SQLite queries on a local server return in <10ms. A loader adds perceived latency, not removes it. | Show results immediately when they arrive. If the response is fast enough (local DB), a loading state is never visible anyway. |
| Persistent recent searches dropdown | Adds localStorage state management for a pattern that is redundant with the existing city grid (the grid IS the persistence layer). | Rely on the existing city grid as the "saved searches" list. |
| Geolocation-based "near me" suggestion | Requires browser geolocation permission prompt. High friction, out of scope for this milestone. | Out of scope — users add cities manually. |
| Autocomplete on city name only, ignoring country | "Springfield" returns 30+ cities; user has no way to tell which is which. | Always show city + country in suggestions. Always rank by population within prefix matches. |

---

## UX Behavior Specification

Concrete, implementable spec for the upgraded SearchBar.

### Trigger Rules

- Minimum 2 characters typed before any query fires.
- Query fires after 200ms of no keystroke (debounce).
- Query does NOT fire on Enter (Enter = select highlighted item, not search).
- Backspacing below 2 characters closes the dropdown immediately.

### Request / Response

- HTTP GET `/api/cities/search?q={input}&limit=8`
- Server returns max 8 results.
- Client renders all returned results (no client-side re-filtering).
- Stale results from a previous query are discarded if a newer response arrives first (use a request ID or AbortController).

### Suggestion List

- Dropdown appears directly below the search input, same width.
- Max 8 items, no scroll within dropdown (if 8 items overflow the viewport, that is a layout concern for the phase).
- Each item: `{City}, {Region}, {Country}` on primary line. Region omitted if null/empty.
- Timezone shown as secondary/muted text on the same row or below, if non-null.
- Matching prefix characters are bold or highlighted.
- One item is "active" (highlighted background). Initial state: no item active (user has not pressed arrow key yet).

### Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `↓` (ArrowDown) | Move active item down. If at bottom, wrap to top (or stop — either is acceptable; wrapping is friendlier). |
| `↑` (ArrowUp) | Move active item up. If at top, wrap to bottom (or stop). |
| `Enter` | Select the currently active item. If no item is active, do nothing (do not submit a free-text search). |
| `Escape` | Close dropdown. Clear active item. Return focus to input. Input text is preserved. |
| `Tab` | Close dropdown (natural focus movement away from input). Do not trap focus in the list. |

### Selection Behavior

1. User clicks a suggestion OR presses Enter on a highlighted suggestion.
2. The city object (id, name, country, region, lat, lon, timezone) is passed to the add-city handler.
3. Weather is fetched using lat + lon (not city name string).
4. Input clears. Dropdown closes. Same UX as v1.0 add-city flow.

### Empty / Error States

| State | Display |
|-------|---------|
| Fewer than 2 characters typed | No dropdown shown |
| Query in flight (>200ms response) | Optionally show a subtle spinner inside the input; acceptable to show nothing if response is fast |
| Zero results returned | Dropdown shows single non-selectable row: "No cities found for '{input}'" |
| Network/server error | Dropdown shows single non-selectable row: "Search unavailable — try again" |

---

## Result Ranking Strategy

Recommended sort order for `/api/cities/search` results:

1. **Prefix match first** — cities whose name starts with the query string rank above cities where the query appears mid-name. Example: query "lon" → "London" (prefix) before "Avalon" (substring).
2. **Population DESC within each tier** — among prefix matches, larger cities rank first. Among substring matches, larger cities rank first.
3. **Country name ASC as tiebreaker** — purely alphabetical tiebreaker when population is equal or null.

SQLite implementation hint:

```sql
SELECT *, 
  CASE WHEN LOWER(name) LIKE LOWER(:prefix) THEN 0 ELSE 1 END AS match_tier
FROM cities
WHERE LOWER(name) LIKE LOWER(:substring)
ORDER BY match_tier ASC, population DESC, country ASC
LIMIT 8;
```

Where `:prefix` = `'london%'` and `:substring` = `'%london%'`. This single query handles both tiers.

**Do not use fuzzy match for this milestone.** SQLite LIKE with `%` is sufficient for 5,000 cities and covers the common case (users know city spelling, may be unsure of exact suffix).

---

## Display Format for Suggestions

### Required fields per suggestion row

```
{City Name}, {Region}, {Country}          ← primary line (region omitted if null)
{Timezone}                                 ← secondary line, muted, omitted if null
```

Example suggestions for input "lon":

```
London, England, United Kingdom
  Europe/London

Long Beach, California, United States
  America/Los_Angeles

Londrina, Paraná, Brazil
  America/Sao_Paulo
```

### Visual hierarchy

- City name: normal weight, full opacity
- Matching prefix: bold or `text-primary` color (accent)
- Region + Country: normal weight, slightly muted
- Timezone: smaller font size, `text-muted` color
- Active/hovered row: subtle background highlight (same TailwindCSS pattern as existing hover states)

---

## Feature Dependencies on Existing Code

| New Feature | Existing v1.0 Dependency | Note |
|-------------|--------------------------|------|
| Suggestion dropdown | SearchBar component | Dropdown is rendered inside or adjacent to SearchBar. No new page needed. |
| Weather fetch via lat/lon | `/api/weather/multiple` or current weather fetch | The existing endpoint likely accepts city name string. Verify whether lat/lon is already supported by weatherapi.com proxy, or if the API route needs a parameter change. |
| City selection handler | `addCity` flow in dashboard | The existing flow adds a city by name. After this milestone it adds by lat/lon + display name. The localStorage schema may need to store lat/lon alongside city name. |
| Duplicate detection | Existing city grid check | Duplicate check currently compares city name strings. After this milestone, compare by city ID or (lat, lon) pair to handle "London, UK" vs "London, Ontario" correctly. |

---

## MVP Recommendation

### Must ship in v1.1

1. 2-character trigger, 200ms debounce
2. Server-side SQLite query, max 8 results
3. Prefix-first + population-DESC ranking
4. City + Region + Country display in each suggestion
5. Keyboard navigation (↑ ↓ Enter Escape)
6. Click-outside dismiss
7. Empty state ("No cities found")
8. Weather fetch via lat/lon instead of city name string
9. Duplicate detection by lat/lon or city ID

### Defer beyond v1.1

- Timezone display in suggestions (add only if it fits naturally in the component)
- Fuzzy matching — not needed for 5,000-city dataset
- Geolocation "near me"
- Recent searches list

---

## Sources

- Autocomplete UX behavior: Nielsen Norman Group combobox and autocomplete studies (stable guidance, pre-2024)
- ARIA Authoring Practices Guide: combobox pattern (WAI-ARIA 1.2) — `https://www.w3.org/WAI/ARIA/apg/patterns/combobox/`
- Debounce timing: well-established in web performance literature; 200ms is the accepted threshold below which users perceive response as "instant"
- Ranking strategy: standard information retrieval practice (prefix > substring, popularity weighting) applied to city search — consistent with how OpenStreetMap Nominatim, Google Places, and weatherapi.com themselves rank results
- Project context: `/home/aiadmin/Documents/frontire AI/Frontire-AI-Coding-Group3/.planning/PROJECT.md`
- Confidence: HIGH — these patterns are stable, widely implemented, and do not depend on rapidly-changing library APIs
