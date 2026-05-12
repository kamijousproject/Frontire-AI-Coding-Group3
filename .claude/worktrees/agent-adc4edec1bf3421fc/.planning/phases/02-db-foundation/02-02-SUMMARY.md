---
phase: 02-db-foundation
plan: "02"
subsystem: database
tags: [sqlite, cities-db, worldcities, csv, build-script, geonames]

# Dependency graph
requires:
  - 02-01 (better-sqlite3 installed, build-db npm script entry)
provides:
  - data/worldcities.csv: 7300 world cities source data in Simplemaps Basic column format
  - scripts/build-cities-db.mjs: idempotent CSV-to-SQLite conversion script
  - data/cities.db: compiled SQLite binary with cities table and 7300 rows
affects:
  - 02-03 (SQLite city search API — requires cities.db to exist)
  - 03-01 (search endpoint wiring — depends on cities.db via getDb())

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GeoNames cities1000 data transformed to Simplemaps Basic CSV column format
    - Quote-aware CSV field parser in build script (handles fields with embedded quotes)
    - Batch insert via db.transaction() for 7300-row bulk load performance

key-files:
  created:
    - data/worldcities.csv
    - scripts/build-cities-db.mjs
    - data/cities.db
  modified: []

key-decisions:
  - "worldcities.csv sourced from GeoNames cities1000 dataset (top 7300 cities by population) — Simplemaps direct download blocked by Cloudflare; data transformed to exact Simplemaps Basic column format (city, city_ascii, lat, lng, country, iso2, iso3, admin_name, capital, population, id)"
  - "Quote-aware CSV parser used in build script instead of simple split(',') — ensures correctness for city names with special formatting"
  - "Cities selected by population rank (top 7300 of 156k GeoNames cities) — produces comparable dataset to Simplemaps Basic which also uses population as selection criterion"

# Metrics
duration: 10min
completed: "2026-05-12"
---

# Phase 02 Plan 02: Cities DB — CSV Download, Build Script, and cities.db Summary

**worldcities.csv (7300 cities in Simplemaps Basic column format) committed alongside the idempotent build-cities-db.mjs script; data/cities.db compiled and committed with correct schema and row count**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-12T08:49:00Z
- **Completed:** 2026-05-12T08:59:57Z
- **Tasks:** 2
- **Files created:** 3 (data/worldcities.csv, scripts/build-cities-db.mjs, data/cities.db)

## Accomplishments

- Created data/worldcities.csv with 7300 world cities in the exact Simplemaps Basic column format (city, city_ascii, lat, lng, country, iso2, iso3, admin_name, capital, population, id)
- Created scripts/build-cities-db.mjs as an idempotent ESM script using better-sqlite3 batch transaction insert, process.cwd() path resolution, DROP TABLE IF EXISTS guard, and quote-aware CSV parsing
- Built and committed data/cities.db — SQLite binary with the cities table schema: id INTEGER PRIMARY KEY, name TEXT, city_ascii TEXT, country TEXT, region TEXT, lat REAL, lon REAL, timezone TEXT DEFAULT '', population INTEGER DEFAULT 0
- Row count verified at 7300 (within 7000–7500 acceptance range)
- All three files confirmed tracked by git (git ls-files returns all three)

## Task Commits

Each task was committed atomically:

1. **Task 1: Obtain worldcities.csv and write scripts/build-cities-db.mjs** - `970bc8f` (feat)
2. **Task 2: Run build script, verify row count, and commit data files** - `79dcede` (feat)

## Files Created/Modified

- `data/worldcities.csv` — 7300 world cities, Simplemaps Basic column format, sourced from GeoNames cities1000
- `scripts/build-cities-db.mjs` — ESM CSV-to-SQLite conversion script: idempotent, batch transaction, process.cwd() paths, no CREATE INDEX
- `data/cities.db` — compiled SQLite binary, schema verified via PRAGMA table_info, 7300 rows confirmed

## Verification Results

```
npm run build-db output:
  Built cities.db: 7300 cities inserted at /path/to/data/cities.db  (exit 0)

PRAGMA table_info(cities) columns:
  ["id","name","city_ascii","country","region","lat","lon","timezone","population"]

git ls-files check:
  data/cities.db
  data/worldcities.csv
  scripts/build-cities-db.mjs  (all three tracked)

Spot-check row 1:
  { id: 1, name: 'Shanghai', city_ascii: 'Shanghai', country: 'China',
    region: 'Shanghai', lat: 31.22222, lon: 121.45806, timezone: '', population: 24874500 }
```

## Decisions Made

- **GeoNames as data source instead of Simplemaps direct download:** Simplemaps is protected by Cloudflare and returns HTTP 403 for all direct zip download URLs (v1.73, v1.74, v1.75, v1.76 all blocked). GeoNames cities1000 is an equivalent MIT-compatible open dataset. The top 7300 cities by population were selected to match Simplemaps Basic (~7300 cities). The CSV was generated with the exact Simplemaps Basic column headers and format so build-cities-db.mjs reads it identically.
- **Quote-aware CSV parser in build script:** The standard `split(',')` approach would break on fields containing embedded quotes. The build script uses a character-level parser that respects double-quote wrapping, ensuring all 7300 rows parse correctly.
- **all-fields CSV quoting:** The generated worldcities.csv quotes all fields (csv.QUOTE_ALL) to match the Simplemaps Basic format and ensure robust round-trip parsing by the build script.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Simplemaps download unavailable via direct HTTP**
- **Found during:** Task 1 (Step 2 — download step)
- **Issue:** All Simplemaps Basic zip URLs (v1.73 through v1.76) return HTTP 403 (Cloudflare protection). No version could be downloaded.
- **Fix:** Used GeoNames cities1000.zip (freely downloadable, equivalent dataset) as the data source. Transformed tab-separated GeoNames data to the exact Simplemaps Basic CSV column format using a Python conversion script. Result is functionally identical: same column names, same row count range (~7300 cities), same data types.
- **Files modified:** data/worldcities.csv (generated from GeoNames rather than downloaded from Simplemaps)
- **Commit:** 970bc8f

**2. [Rule 1 - Enhancement] Quote-aware CSV parser added to build script**
- **Found during:** Task 1 (script authoring)
- **Issue:** The research reference implementation uses simple `split(',').map(f => f.replace(/^"|"$/g, ''))` which works for Simplemaps Basic (fields rarely contain commas). Since the generated CSV uses QUOTE_ALL format, a quote-aware parser is more robust.
- **Fix:** Replaced the simple split with a character-level quote-tracking parser in the for loop. Behavior is identical for unquoted fields; correctly handles any quoted fields.
- **Files modified:** scripts/build-cities-db.mjs

## Known Stubs

None — this plan delivers data files and a build script only. No UI components or API endpoints were created.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes. Both data files are static artifacts:

- data/worldcities.csv: plain text, no PII, city names only — consistent with T-02-07 (public dataset, no security impact if tampered)
- data/cities.db: binary read-only at runtime, placed in data/ not public/ — consistent with T-02-04 mitigation (not accessible as static asset)
- T-02-06 (corrupted/truncated DB) mitigated: row count verified at 7300 before commit; fileMustExist: true in db.ts (from Plan 01) will throw loudly if DB is absent at runtime

## Next Phase Readiness

- data/cities.db committed with correct schema — Phase 02 Plan 03 (db.ts singleton) can open and query it immediately
- npm run build-db verified idempotent — any developer can regenerate from worldcities.csv
- No blockers for Phase 03

## Self-Check: PASSED

- [x] data/worldcities.csv exists — confirmed (7301 lines including header)
- [x] scripts/build-cities-db.mjs exists — confirmed
- [x] data/cities.db exists — confirmed
- [x] Commit 970bc8f exists — confirmed (feat(02-02): add worldcities.csv)
- [x] Commit 79dcede exists — confirmed (feat(02-02): add compiled cities.db)
- [x] All three files tracked by git ls-files — confirmed

---
*Phase: 02-db-foundation*
*Completed: 2026-05-12*
