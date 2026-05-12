---
phase: 03-server-persistence-layer
plan: 02
subsystem: api
tags: [validation, coordinates, weather-api, cache, typescript]

# Dependency graph
requires:
  - phase: 03-server-persistence-layer
    plan: 01
    provides: validateSearchQuery in validation.ts, CityEntry interface
  - phase: 02-db-foundation
    provides: getDb() singleton, better-sqlite3 setup
provides:
  - validateCoordPairs() exported from src/lib/validation.ts
  - Coordinate-based GET /api/v1/weather/current?q=lat,lon endpoint
  - Pipe/colon GET /api/v1/weather/multiple?cities=lat:lon|lat:lon endpoint
affects:
  - 03-03 (weather-by-latlon — weather routes now accept coordinates matching CityEntry.lat/.lon)
  - 03-04 (UAT — verifies coordinate-based weather endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "toFixed(4) normalization before cache key construction and weatherapi.com URL"
    - "pipe/colon delimiter for multiple coordinate pairs — avoids ambiguity with comma in lat,lon"
    - "validateCoordPairs reuses validateCoordParam internally — no duplicated range-check logic"
    - "Partial-success pattern: Promise.allSettled maps failures to WeatherError entries"

key-files:
  created: []
  modified:
    - src/lib/validation.ts
    - src/app/api/v1/weather/current/route.ts
    - src/app/api/v1/weather/multiple/route.ts

key-decisions:
  - "Cache key format: lat.toFixed(4) + ',' + lon.toFixed(4) — comma-separated for weatherapi.com compatibility, consistent with q= parameter"
  - "pipe/colon delimiter chosen for /multiple — avoids ambiguity with comma used inside each lat,lon pair"
  - "validateCoordPairs returns null on ANY invalid segment rather than partial results — fail-fast for all-or-nothing validation"
  - "WeatherError.city uses coordinate string (e.g. '13.7500,100.5170') not a city name — identifies failure point precisely"

requirements-completed:
  - API-02
  - API-03

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 3 Plan 2: Coordinate-Based Weather Endpoints Summary

**Coordinate-aware weather endpoints with validateCoordPairs() — lat/lon normalized with toFixed(4) for cache keys and weatherapi.com q= parameter; pipe/colon delimiter for multiple-city requests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T09:39:57Z
- **Completed:** 2026-05-12T09:42:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `validateCoordPairs()` added to `src/lib/validation.ts`: splits pipe-separated lat:lon pairs, validates each component via `validateCoordParam()`, enforces max 10 pairs, returns `{lat, lon}[]` or null
- `weather/current` route updated: accepts `?q=lat,lon` (replaced `?city=`), validates with `validateCoordParam`, normalizes with `toFixed(4)` for cache key and weatherapi.com query string
- `weather/multiple` route updated: accepts `?cities=lat:lon|lat:lon` pipe format (replaced `?cities=city1,city2`), uses `validateCoordPairs`, preserves partial-success behavior via `Promise.allSettled`
- TDD RED/GREEN cycle: failing test committed before implementation; all 10 test cases pass after implementation

## Task Commits

Each task was committed atomically:

1. **test(03-02): add failing test for validateCoordPairs** - `c4d5b6c` (RED phase)
2. **feat(03-02): implement validateCoordPairs in validation.ts** - `dffb78a` (GREEN phase)
3. **feat(03-02): update weather routes to accept coordinate-based parameters** - `9ade0ed` (Task 2)

## Files Created/Modified

- `src/lib/validation.ts` — Added `validateCoordPairs()` after `validateSearchQuery`; all 4 prior exports preserved
- `src/app/api/v1/weather/current/route.ts` — Replaced `?city=` + `validateCityParam` with `?q=lat,lon` + `validateCoordParam`; `toFixed(4)` used for both cache key and weatherapi query
- `src/app/api/v1/weather/multiple/route.ts` — Replaced comma-separated city names with pipe/colon coordinate pairs; imports `validateCoordPairs`; error count check uses `split('|')`
- `src/lib/validation.test.js` — TDD test file for `validateCoordPairs` behavior verification (10 cases)

## Decisions Made

- Cache key format uses `lat.toFixed(4) + ',' + lon.toFixed(4)` (comma) for weatherapi.com compatibility — the same string is passed as the `q=` parameter, so cache hit avoids a redundant API call with the exact same query string.
- Pipe/colon delimiter for `/multiple` avoids ambiguity: a bare comma inside a lat/lon pair would conflict with comma-separated multi-city syntax.
- `validateCoordPairs` fails entirely on the first invalid segment (no partial results) — consistent with `validateCitiesParam` behavior and simpler error handling at the route level.
- `WeatherError.city` field set to coordinate string (e.g. `"13.7500,100.5170"`) rather than a display city name — the coordinate is what the caller submitted, making failure attribution unambiguous.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

Threats T-03-06 through T-03-10 from the plan's threat model are all mitigated as specified:

- **T-03-06** (injection via `?q=`): `validateCoordParam` rejects non-numeric and out-of-range; `cacheKey` built from parsed floats via `toFixed(4)`, never from raw user string.
- **T-03-07** (injection via `?cities=`): `validateCoordPairs` rejects segments with wrong part count, non-numeric, or out-of-range values; no raw user string reaches weatherapi.com.
- **T-03-08** (DoS via 11+ pairs): `validateCoordPairs` returns null and route returns 400 before any upstream calls.
- **T-03-09** (key exposure): Upstream errors caught and re-thrown with internal code; raw weatherapi body never forwarded.
- **T-03-10** (cache poisoning): Cache keyed by `toFixed(4)` float string — finite key space.

No new threat surface introduced beyond what the plan's threat model covers.

## Known Stubs

None - all coordinate parsing and routing logic is fully wired.

---
*Phase: 03-server-persistence-layer*
*Completed: 2026-05-12*

## Self-Check: PASSED

- src/lib/validation.ts: FOUND
- src/app/api/v1/weather/current/route.ts: FOUND
- src/app/api/v1/weather/multiple/route.ts: FOUND
- .planning/phases/03-server-persistence-layer/03-02-SUMMARY.md: FOUND
- Commit c4d5b6c (test RED): FOUND
- Commit dffb78a (Task 1 GREEN): FOUND
- Commit 9ade0ed (Task 2): FOUND
