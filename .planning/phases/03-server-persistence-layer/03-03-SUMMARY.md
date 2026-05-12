---
phase: 03-server-persistence-layer
plan: 03
subsystem: hooks
tags: [localStorage, CityEntry, useWeather, coordinates, typescript]

# Dependency graph
requires:
  - phase: 03-server-persistence-layer
    plan: 01
    provides: CityEntry interface in src/types/weather.ts
  - phase: 03-server-persistence-layer
    plan: 02
    provides: coordinate-based weather endpoints (/current?q=, /multiple?cities=)
provides:
  - useCityStorage hook — CityEntry[] storage under 'weather_cities_v2' key
  - useWeather hook — accepts CityEntry[], fetches coordinate-based weather API
affects:
  - 03-04 (UAT — verifies full persistence + coordinate weather flow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isCityEntry() type guard validates all 7 fields including nullable region — malformed items dropped silently"
    - "weather_cities_v2 key with silent v1 reset — no migration, clean empty state"
    - "coordKey() = lat.toFixed(4) + ',' + lon.toFixed(4) — canonical Map key and URL param"
    - "citiesKey = city IDs joined — stable useEffect dependency not affected by data updates"
    - "pipe/colon citiesParam for /multiple — colon separates lat:lon, pipe separates pairs"

key-files:
  created: []
  modified:
    - src/hooks/useLocalStorage.ts
    - src/hooks/useWeather.ts
    - src/components/SearchBar.tsx
    - src/components/WeatherGrid.tsx
    - src/app/page.tsx

key-decisions:
  - "isCityEntry() drops malformed individual items rather than rejecting the entire array — partial recovery over hard reset"
  - "coordKey() helper defined in useWeather (not imported) — keeps coordinate normalization co-located with its only consumer"
  - "Rule 3 auto-fix: SearchBar, WeatherGrid, and page.tsx updated in Task 2 commit — required to unblock TypeScript compilation"

requirements-completed:
  - PERSIST-01
  - PERSIST-02

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 3 Plan 3: useCityStorage + useWeather Migration to CityEntry Summary

**useCityStorage stores CityEntry[] under 'weather_cities_v2' with id-based dedup; useWeather fetches coordinates via pipe/colon format with toFixed(4) normalization**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T09:45:25Z
- **Completed:** 2026-05-12T09:48:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `useCityStorage` fully rewritten: stores `CityEntry[]` under `'weather_cities_v2'`; `isCityEntry()` type guard validates all 7 fields including nullable `region`; duplicate detection by `city.id` (number); `removeCity` takes `cityId: number`; v1 `'weather_cities'` key never read — v1 users get empty dashboard
- `useWeather` fully rewritten: accepts `CityEntry[]`; builds pipe/colon `citiesParam` for `/api/v1/weather/multiple`; `coordKey()` helper normalizes to `toFixed(4)`; `retryCity` takes `CityEntry` and uses `?q=lat,lon`; `citiesKey` derived from city IDs for stable dependency
- `SearchBar`, `WeatherGrid`, `page.tsx` updated (Rule 3 auto-fix) to complete the type-safe CityEntry pipeline end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite useCityStorage for CityEntry[] with v2 key** - `8799874` (feat)
2. **Task 2: Update useWeather + UI components for CityEntry[]-based API** - `a11a0d4` (feat)

## Files Created/Modified

- `src/hooks/useLocalStorage.ts` — Full rewrite: CityEntry[], weather_cities_v2 key, isCityEntry guard, id-based duplicate/remove
- `src/hooks/useWeather.ts` — Full rewrite: CityEntry[], coordKey(), pipe/colon citiesParam, retryCity(CityEntry), citiesKey by ID
- `src/components/SearchBar.tsx` — Updated props to CityEntry[]/onAddCity(CityEntry); id-based duplicate check; renders nullable region
- `src/components/WeatherGrid.tsx` — Updated props to CityEntry[]/onRemoveCity(id)/retryCity(CityEntry); coordKey for Map lookups
- `src/app/page.tsx` — Wired CityEntry import; handleRetry uses coordKey for retryExhausted Map; passes removeCity directly

## Decisions Made

- `isCityEntry()` silently drops individual malformed array items rather than resetting the entire list. This provides partial recovery when a single entry is corrupted while preserving the rest of the user's city list.
- `coordKey()` is defined locally in each file that needs it rather than exported from a shared module. The function is a one-liner; sharing it would add an import dependency not justified by the size.
- `'weather_cities_v2'` key with no migration path. v1 users lose their string[] city list but gain a clean slate with the new coordinate-aware system — consistent with the STATE.md PERSIST-02 decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated SearchBar, WeatherGrid, and page.tsx to accept CityEntry-based API**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** After rewriting useWeather and useCityStorage to CityEntry-based APIs, `npx tsc --noEmit` reported 5 type errors in `src/app/page.tsx` — the page and its child components still had `string[]`/`string` in their prop signatures, making the new hooks incompatible
- **Fix:** Updated SearchBar props (`cities: CityEntry[]`, `onAddCity(CityEntry)`), WeatherGrid props (`cities: CityEntry[]`, `retryCity(CityEntry)`, `onRemoveCity(id: number)`), and page.tsx to use `CityEntry` throughout with coordKey-based retryExhausted map
- **Files modified:** src/components/SearchBar.tsx, src/components/WeatherGrid.tsx, src/app/page.tsx
- **Commit:** a11a0d4

## Threat Surface Scan

All threats T-03-11 through T-03-15 from the plan's threat model are mitigated as specified:

- **T-03-11** (localStorage poisoning): `isCityEntry()` validates all 7 fields; malformed items silently dropped
- **T-03-12** (v1 string[] data): `readFromStorage()` reads only `'weather_cities_v2'`; v1 `'weather_cities'` key never accessed
- **T-03-13** (unbounded CityEntry[]): `slice(0, MAX_CITIES)` in read; `prev.length >= MAX_CITIES` guard in `addCity`
- **T-03-14** (lat/lon in localStorage): accepted — city-level precision, user-chosen data, no PII
- **T-03-15** (crafted lat/lon injection): `coordKey()` calls `toFixed(4)` on parsed number; API routes validate independently

No new threat surface introduced.

## Known Stubs

None — city data fully wired from SQLite search through localStorage persistence to coordinate-based weather API.

---
*Phase: 03-server-persistence-layer*
*Completed: 2026-05-12*

## Self-Check: PASSED

- src/hooks/useLocalStorage.ts: FOUND
- src/hooks/useWeather.ts: FOUND
- src/components/SearchBar.tsx: FOUND
- src/components/WeatherGrid.tsx: FOUND
- src/app/page.tsx: FOUND
- .planning/phases/03-server-persistence-layer/03-03-SUMMARY.md: FOUND
- Commit 8799874 (Task 1): FOUND
- Commit a11a0d4 (Task 2): FOUND
