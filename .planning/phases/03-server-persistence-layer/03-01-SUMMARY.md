---
phase: 03-server-persistence-layer
plan: 01
subsystem: api
tags: [sqlite, better-sqlite3, typescript, validation, city-search]

# Dependency graph
requires:
  - phase: 02-db-foundation
    provides: getDb() singleton opening cities.db with better-sqlite3
provides:
  - CityEntry interface exported from src/types/weather.ts
  - validateSearchQuery() exported from src/lib/validation.ts
  - SQLite-backed GET /api/v1/cities/search endpoint (replaces weatherapi.com dependency)
affects:
  - 03-02 (SearchBar type-ahead — consumes CityEntry[])
  - 03-03 (weather-by-latlon — depends on CityEntry lat/lon fields)
  - 03-04 (UAT — verifies search endpoint behavior)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parameterized LIKE ? query with positional parameter — SQL injection prevention"
    - "validateSearchQuery reuses module-scope CITY_PATTERN for consistent char class enforcement"
    - "getDb() singleton called once per request — no per-request connection overhead"

key-files:
  created: []
  modified:
    - src/types/weather.ts
    - src/lib/validation.ts
    - src/app/api/v1/cities/search/route.ts

key-decisions:
  - "Reuse CITY_PATTERN in validateSearchQuery rather than defining a duplicate SEARCH_PATTERN — identical character class, single source of truth"
  - "SELECT only the 7 CityEntry fields (exclude city_ascii and population) — matches interface exactly, avoids unnecessary data transfer"

patterns-established:
  - "CityEntry is the canonical city type for all Phase 03+ consumers — import from @/types/weather"
  - "All user-controlled string inputs validated via validateSearchQuery before reaching the DB layer"

requirements-completed:
  - API-01

# Metrics
duration: 8min
completed: 2026-05-12
---

# Phase 3 Plan 1: CityEntry Type + SQLite City Search Endpoint Summary

**SQLite-backed /api/v1/cities/search with parameterized LIKE query, CityEntry type contract, and validateSearchQuery() — zero weatherapi.com dependency**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-12T09:28:00Z
- **Completed:** 2026-05-12T09:36:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- CityEntry interface added to src/types/weather.ts with all 7 fields including nullable region (required for Hong Kong/Singapore)
- validateSearchQuery() added to src/lib/validation.ts — enforces 2-char minimum, 100-char maximum, safe character set via existing CITY_PATTERN
- cities/search route fully replaced: weatherapi.com removed, SQLite via getDb() with parameterized LIKE ? query, LIMIT 8, ORDER BY population DESC

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CityEntry interface and validateSearchQuery** - `f454878` (feat)
2. **Task 2: Rewrite cities/search route to use SQLite** - `b4ceee7` (feat)

## Files Created/Modified

- `src/types/weather.ts` - Added CityEntry interface with 7 fields (id, name, country, region nullable, lat, lon, timezone)
- `src/lib/validation.ts` - Added validateSearchQuery() using existing CITY_PATTERN, appended after validateCoordParam
- `src/app/api/v1/cities/search/route.ts` - Fully replaced: now uses getDb() + parameterized SQL, no weatherapi.com dependency

## Decisions Made

- Reused existing module-scope `CITY_PATTERN` in `validateSearchQuery` rather than defining a new `SEARCH_PATTERN` — the patterns are identical (`^[a-zA-Z0-9 ,'.\\-]+$`), so a single constant avoids duplication and drift.
- SELECT omits `city_ascii` and `population` columns — they are not part of the CityEntry interface and excluding them keeps the response payload minimal and type-safe.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CityEntry type is available for import at `@/types/weather` — all Phase 03 plans (03-02, 03-03) may depend on it immediately
- GET /api/v1/cities/search?q= is live with SQLite backend — SearchBar type-ahead (03-02) can now fetch real results
- validateSearchQuery() covers the T-03-01 injection threat via character class + parameterized query (defense in depth)

---
*Phase: 03-server-persistence-layer*
*Completed: 2026-05-12*
