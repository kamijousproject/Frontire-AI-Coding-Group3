# Architecture: SQLite City Database Integration

**Project:** Frontier AI — Weather Dashboard v1.1
**Researched:** 2026-05-12
**Scope:** Adding SQLite city database to existing Next.js 16 App Router on Railway

---

## System Overview (Current v1.0 → Target v1.1)

```
v1.0 (current)                          v1.1 (target)
─────────────────────────────────────── ───────────────────────────────────────────────────────
Browser                                 Browser
  SearchBar                               SearchBar (upgraded)
    └─ debounce 300ms                       └─ debounce 300ms
    └─ GET /api/v1/cities/search?q=         └─ GET /api/v1/cities/search?q=         [same URL]
         └─ weatherapi.com search.json           └─ cities.db SQLite (local file)   [SOURCE CHANGES]
                                                      └─ SELECT ... LIKE '%q%'
  onAddCity(result.name)  ←── string        onAddCity(result)  ←── CityEntry object  [PAYLOAD CHANGES]
  localStorage["weather_cities"]            localStorage["weather_cities"]
    string[]                                  CityEntry[] (with lat, lon)             [SCHEMA CHANGES]

  useWeather(cities: string[])              useWeather(cities: CityEntry[])            [SIG CHANGES]
  GET /api/v1/weather/multiple              GET /api/v1/weather/multiple
    ?cities=London,Paris                      ?cities=51.51,-0.13|48.86,2.35          [PARAM CHANGES]
      └─ fetchCurrentWeather("London")          └─ fetchCurrentWeather("51.51,-0.13") [URL CHANGES]
         └─ ?q=London                              └─ ?q=51.51,-0.13
```

---

## Decision 1: Where Does cities.db Live?

**Answer: `data/cities.db` at the project root.**

Do NOT place it in:
- `public/` — anything in `public/` is served as a static file; the SQLite binary would
  be publicly downloadable. Security anti-pattern.
- Committed inside `src/` — source directories have no special status for binary files,
  but it is confusing to mix source code with data files.
- The project root directly — not wrong, but `data/` signals intent clearly and is
  conventional for bundled data files.

Railway NIXPACKS builds copy the full repo into the image, so `data/cities.db` at the
project root is present at runtime at the absolute path the Node.js process can resolve
via `process.cwd()`. This is the same mechanism that makes `.env` files work.

**File structure:**

```
project root/
├── data/
│   └── cities.db          ← committed binary, read-only at runtime
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── cities/
│   │   │   │   │   └── search/
│   │   │   │   │       └── route.ts   ← MODIFIED: SQLite instead of weatherapi
│   │   │   │   ├── weather/
│   │   │   │   │   ├── current/
│   │   │   │   │   │   └── route.ts   ← MODIFIED: accepts lat,lon format
│   │   │   │   │   └── multiple/
│   │   │   │   │       └── route.ts   ← MODIFIED: accepts lat,lon format
│   │   │   │   └── health/
│   │   │   │       └── route.ts       ← UNCHANGED
│   ├── lib/
│   │   ├── db.ts           ← NEW: SQLite singleton
│   │   ├── cache.ts        ← MODIFIED: key changes city string → coord string
│   │   ├── weatherapi.ts   ← MODIFIED: coord-first parameter
│   │   ├── validation.ts   ← MODIFIED: add validateCoordPair helper
│   │   ├── rate-limit.ts   ← UNCHANGED
│   │   └── condition-backgrounds.ts ← UNCHANGED
│   ├── types/
│   │   └── weather.ts      ← MODIFIED: CityEntry replaces bare string
│   ├── components/
│   │   ├── SearchBar.tsx    ← MODIFIED: emits CityEntry, not string
│   │   ├── WeatherCard.tsx  ← UNCHANGED (receives WeatherData same shape)
│   │   └── WeatherGrid.tsx  ← MINOR: key on city.id not city string
│   ├── hooks/
│   │   ├── useLocalStorage.ts ← MODIFIED: stores CityEntry[], not string[]
│   │   └── useWeather.ts   ← MODIFIED: CityEntry[] → coord-based fetch
│   └── app/
│       └── page.tsx        ← UNCHANGED (prop types flow through)
```

---

## Decision 2: SQLite Connection Management

**Answer: Process-level singleton, read-only, opened once.**

### Why not per-request?

Opening a SQLite file is cheap (microseconds) but non-trivial. More importantly, in
Next.js App Router, each API route handler file is a separate module. If you open DB
inside the handler, you open a new file descriptor every request and rely on Node.js GC
to close it, which causes descriptor leak under load.

### Why not a connection pool?

SQLite has one writer at a time, but since `cities.db` is **read-only** (never written
at runtime), there is no contention concern. A pool adds complexity for zero benefit.
`better-sqlite3` is synchronous and thread-safe for concurrent reads.

### Pattern: Module-level singleton

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

// process.cwd() resolves to the project root at both dev and Railway runtime.
// __dirname is unreliable in Next.js (points into .next/server/).
const DB_PATH = path.join(process.cwd(), 'data', 'cities.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}
```

The `_db` variable lives in the Node.js module cache. Next.js App Router runs API routes
in a long-lived Node.js process (not edge runtime). The singleton is initialized on first
request and reused for the process lifetime — exactly matching how `src/lib/cache.ts` and
`src/lib/rate-limit.ts` manage their in-memory stores.

**Key flags:**
- `readonly: true` — prevents any accidental write; also signals intent clearly
- `fileMustExist: true` — fails fast at startup if `data/cities.db` is missing from
  the Railway image (easier to diagnose than a silent empty-results bug)

### Library choice: `better-sqlite3`

Use `better-sqlite3`, not `sqlite3` (async/callback) or `sql.js` (WASM). Reasons:
- Synchronous API matches how existing lib functions (cache, rate-limit) work; no async
  waterfall to introduce for a simple SELECT
- Zero native build issues on NIXPACKS — NIXPACKS installs build tools by default
- Widely used in Next.js projects; well-maintained
- `@types/better-sqlite3` available for full TypeScript coverage

**Install:**
```
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

---

## Decision 3: /api/v1/cities/search Route Changes

**Current implementation** (`src/app/api/v1/cities/search/route.ts`):
- Receives `?q=` param
- Calls `fetchCitySearch(q)` which hits `weatherapi.com/search.json`
- Returns `CitySearchResult[]` — `{ name, region, country }`

**New implementation:**
- Receives same `?q=` param (URL unchanged — SearchBar already calls this endpoint)
- Queries `cities.db` with a parameterized LIKE query
- Returns `CityEntry[]` — `{ id, name, country, region, lat, lon }`

### New response shape: `CityEntry`

```typescript
// src/types/weather.ts — add alongside existing interfaces
export interface CityEntry {
  id: number;       // SQLite rowid — used as React key and localStorage identity
  name: string;     // "Bangkok"
  country: string;  // "Thailand"
  region: string;   // "Krung Thep" (may be empty string for some cities)
  lat: number;      // 13.75
  lon: number;      // 100.517
}
```

`CitySearchResult` (the old `{ name, region, country }`) becomes deprecated. It can be
removed or aliased to `CityEntry` once the migration is complete.

### SQLite query pattern

```sql
SELECT id, name, country, region, lat, lon
FROM cities
WHERE name LIKE ?
ORDER BY population DESC
LIMIT 5;
```

The LIKE parameter should be `q + '%'` (prefix match, not `%q%` full-scan) for
performance on 5,000 rows. Prefix match returns results a user is more likely to want
(typing "Bang" returns "Bangkok" not "Phang Nga"). Index on `name` column is recommended
in the database itself. At 5,000 rows even a full scan is sub-millisecond, but the
pattern matters for correctness.

### What happens to `fetchCitySearch` in `weatherapi.ts`?

Remove it — or stub it out with a comment marking it deprecated. The function is only
called from `src/app/api/v1/cities/search/route.ts`. Once that route switches to SQLite,
`fetchCitySearch` becomes dead code. Removing it keeps the codebase honest and reduces
surface area.

The `weatherapi.com search.json` endpoint is no longer needed at all for city lookup.

---

## Decision 4: /api/v1/weather/current and /multiple — Coordinate-Based Lookup

`fetchCurrentWeather` currently accepts a city name string and passes it as `?q=London`
to weatherapi.com. The weatherapi.com current.json endpoint also accepts `?q=lat,lon`
(e.g. `?q=13.75,100.517`) as documented.

**Change:** Pass `lat,lon` as the `q` parameter instead of the city name.

```typescript
// BEFORE
await fetchCurrentWeather("London")   → ?q=London

// AFTER
await fetchCurrentWeather(13.75, 100.517)  → ?q=13.75,100.517
// or, keeping a single-argument signature:
await fetchCurrentWeather("13.75,100.517") → ?q=13.75,100.517
```

The string-argument approach (`"lat,lon"` as a single string) requires the least change
across callers. The existing validation and cache key logic can stay consistent.

### Cache key change

Currently the cache key is the city name string (lowercased). With lat/lon lookup, use
`"lat,lon"` as the key — e.g. `"13.75,100.517"`. This works because:
- Two cities with the same lat/lon are the same place (no false deduplication)
- The key is deterministic from the CityEntry stored in localStorage

The `normalizeKey` function in `src/lib/cache.ts` continues to work unchanged (it just
lowercases and trims, which is a no-op for numeric strings).

### Validation changes

`validateCityParam` currently validates against `CITY_PATTERN` (`^[a-zA-Z0-9 ,'.\\-]+$`).
The pattern already allows digits, period, comma, and hyphen — meaning `"13.75,100.517"`
and `"-34.0,151.0"` pass validation without any change needed.

However, the `validateCitiesParam` function splits on comma to parse multiple cities. With
lat/lon pairs like `"13.75,100.517|48.86,2.35"`, commas inside a coordinate pair would
break the parser. The delimiter must change from comma to pipe `|` for the `/multiple`
endpoint.

```
BEFORE: ?cities=London,Paris,Tokyo
AFTER:  ?cities=13.75:100.517|48.86:2.35|35.69:139.69
```

Use colon `:` as the lat/lon separator and pipe `|` as the city separator to avoid
ambiguity. A new `validateCoordCitiesParam` function handles the new format.

---

## Decision 5: localStorage Schema Change

**Current schema:** `weather_cities` → `string[]` of city name strings (lowercased, trimmed)

**New schema:** `weather_cities` → `CityEntry[]`

```json
[
  { "id": 1842, "name": "Bangkok", "country": "Thailand", "region": "Krung Thep", "lat": 13.75, "lon": 100.517 },
  { "id": 399, "name": "London", "country": "United Kingdom", "region": "England", "lat": 51.507, "lon": -0.128 }
]
```

### Migration on parse

The existing `readFromStorage` in `useLocalStorage.ts` guards against parse errors by
returning `[]`. When v1.1 deploys, any browser with the old string-array format will hit
the string-filter guard `typeof item === 'string'` and silently return `[]` — which is
the correct behavior. No explicit migration code needed. Users lose their saved cities on
first v1.1 load; this is acceptable given the scope.

### Duplicate detection change

Currently `SearchBar.handleSelect` compares `result.name.toLowerCase()`. With CityEntry,
compare on `entry.id`. This is more correct: two cities named "Springfield" in different
countries are no longer treated as the same city.

```typescript
// BEFORE
if (cities.some((c) => c.toLowerCase().trim() === norm))

// AFTER
if (cities.some((c) => c.id === result.id))
```

---

## Decision 6: /api/weather/search (old weatherapi search) — Deprecated or Kept?

**Answer: Remove the weatherapi-backed search entirely. Do not keep it as fallback.**

Rationale:
- The `/api/v1/cities/search` endpoint URL does not change — only its implementation.
- The SearchBar already calls `/api/v1/cities/search` and continues to do so.
- A fallback to weatherapi.com search would introduce split behavior (some results have
  lat/lon from SQLite, others only have name strings from weatherapi) that breaks the
  coordinate-first weather fetch.
- Keeping dead code paths creates maintenance confusion.

If `cities.db` is missing or the query returns zero results, the endpoint returns `[]`
(consistent with the existing empty-array contract). This is a known edge case; the user
sees "No cities found" in the dropdown. No weatherapi fallback needed.

---

## Full Data Flow: SearchBar Selection → Weather Fetch

```
1. USER TYPES in SearchBar input
   └─ onChange → debounce 300ms → GET /api/v1/cities/search?q=Bang

2. SERVER: /api/v1/cities/search/route.ts
   └─ checkRateLimit(request)
   └─ validateCityParam(q) → "Bang"
   └─ getDb()                           ← singleton, already open
   └─ db.prepare(SQL).all("Bang%")      ← synchronous, ~0.1ms
   └─ return CityEntry[5]

3. BROWSER receives CityEntry[]
   └─ SearchBar renders dropdown: "Bangkok, Krung Thep, Thailand"

4. USER SELECTS "Bangkok"
   └─ handleSelect(cityEntry: CityEntry)
   └─ duplicate check: cities.some(c => c.id === cityEntry.id) → false
   └─ onAddCity(cityEntry)              ← prop signature changes from string to CityEntry

5. page.tsx → useCityStorage.addCity(cityEntry)
   └─ setCities([...prev, cityEntry])
   └─ localStorage.setItem("weather_cities", JSON.stringify([...prev, cityEntry]))

6. useWeather([cityEntry]) fires (citiesKey dependency changes)
   └─ builds param: "13.75:100.517"    ← lat:lon format, | separator per city
   └─ GET /api/v1/weather/multiple?cities=13.75:100.517

7. SERVER: /api/v1/weather/multiple/route.ts
   └─ checkRateLimit(request)
   └─ validateCoordCitiesParam("13.75:100.517") → [{ lat: 13.75, lon: 100.517 }]
   └─ per coord pair:
       └─ cacheKey = "13.75,100.517"
       └─ cache.get("13.75,100.517") → null (first time)
       └─ fetchCurrentWeather(13.75, 100.517)
           └─ GET https://api.weatherapi.com/v1/current.json?q=13.75,100.517
       └─ cache.set("13.75,100.517", weatherData)
   └─ return MultiWeatherResult[]

8. BROWSER: useWeather receives results
   └─ results.set("13.75,100.517", weatherData)  ← key is coordKey not city name
   └─ WeatherGrid renders WeatherCard

9. WeatherCard shows: "Bangkok", "Thailand", 34°C / 93°F, etc.
   (city name shown from weatherData.city returned by weatherapi.com)
```

---

## Component Integration Map

### NEW files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | SQLite singleton — `getDb()` returns shared `Database` instance |
| `data/cities.db` | Committed binary — SQLite database with ~5,000 cities |

### MODIFIED files

| File | What Changes | Nature |
|------|-------------|--------|
| `src/types/weather.ts` | Add `CityEntry` interface; deprecate `CitySearchResult` | Additive |
| `src/lib/weatherapi.ts` | `fetchCurrentWeather(lat, lon)` — coord params; remove `fetchCitySearch` | Breaking sig |
| `src/lib/validation.ts` | Add `validateCoordCitiesParam` for pipe-delimited pairs | Additive |
| `src/lib/cache.ts` | Cache key becomes coord string; logic unchanged | Key format only |
| `src/app/api/v1/cities/search/route.ts` | SQLite query replaces weatherapi call | Implementation |
| `src/app/api/v1/weather/current/route.ts` | Parse `?lat=&lon=` or `?q=lat:lon`; pass coords to fetchCurrentWeather | Param format |
| `src/app/api/v1/weather/multiple/route.ts` | Parse pipe-delimited coord pairs | Param format |
| `src/hooks/useLocalStorage.ts` | Store `CityEntry[]`; update guards; update dedup logic | Schema change |
| `src/hooks/useWeather.ts` | Accept `CityEntry[]`; build coord-based URL | Signature + URL |
| `src/components/SearchBar.tsx` | `onAddCity(CityEntry)` instead of `onAddCity(string)` | Prop type |
| `src/components/WeatherGrid.tsx` | Key on `city.id`; lookup key is coord string | Key change |
| `src/app/page.tsx` | No logic change; prop types flow through correctly | Likely no-op |

### UNCHANGED files

| File | Why unchanged |
|------|--------------|
| `src/lib/rate-limit.ts` | IP-based rate limiting, independent of city schema |
| `src/lib/condition-backgrounds.ts` | Reads `condition_code` and `is_day` from `WeatherData`, unchanged |
| `src/components/WeatherCard.tsx` | Receives `WeatherData | ErrorResponse`; that shape does not change |
| `src/app/api/v1/health/route.ts` | Health check is local-only, unchanged |
| `src/app/layout.tsx` | Layout, fonts, metadata — untouched |
| `src/app/globals.css` | Styles untouched |

---

## Railway Deployment Impact

### NIXPACKS build behavior

NIXPACKS detects Node.js projects and runs `npm install && npm run build`. It copies the
full repository into the image, so `data/cities.db` committed to the repo will be present
at the correct path (`/app/data/cities.db` or similar) at runtime. `process.cwd()` in
the running Next.js server process resolves to the app root where NIXPACKS placed the
files.

### Native module concern: `better-sqlite3`

`better-sqlite3` includes a native C++ addon compiled for the host OS and Node.js ABI.
NIXPACKS provides build tools (gcc, make, python3) during the build phase and by default
builds native modules via `npm install`. This works correctly. No extra NIXPACKS
configuration is needed.

**Verify:** The existing `railway.json` uses `NIXPACKS` builder. No changes to
`railway.json` are needed for the SQLite integration.

### Read-only filesystem note

Railway persistent volumes are optional add-ons. The default Railway service has an
ephemeral filesystem. Since `cities.db` is **committed** to the repo and **read-only at
runtime**, this is not a concern — the file is baked into the image at build time, not
written at runtime.

### Environment variables

No new environment variables required. The DB path is derived from `process.cwd()`, not
an env var. This is intentional: `process.cwd()` is always the project root in both
Railway and local dev, so there is nothing to configure.

---

## WeatherData Model: Does It Change?

**No.** `WeatherData` itself does not need lat/lon added.

The lat/lon is the *input* used to fetch weather (stored in `CityEntry` in localStorage).
The weatherapi.com response includes `location.name`, `location.country`, etc., which are
the display fields. `WeatherData` is an output model for the weather response; its shape
is unaffected by using coordinates as the query parameter.

What changes is how `WeatherData` is looked up in the results map in `useWeather` and
`WeatherGrid`. The map key changes from `city.toLowerCase()` to `"lat:lon"`.

---

## Build Order: What Depends on What

```
Phase A — Foundation (no external dependencies; do first)
├── A1. Add `data/cities.db` to repo              [no code deps]
├── A2. Install better-sqlite3 package             [no code deps, enables A3]
└── A3. Write `src/lib/db.ts` singleton            [depends on A2]

Phase B — Type System (all other code depends on these types)
└── B1. Add `CityEntry` to `src/types/weather.ts` [depends on A3 conceptually]

Phase C — Server Layer (each independent, but all need Phase B)
├── C1. Rewrite `src/app/api/v1/cities/search/route.ts`
│       [depends on A3 db singleton, B1 CityEntry]
├── C2. Add `validateCoordCitiesParam` to `src/lib/validation.ts`
│       [depends on B1 conceptually; standalone function]
├── C3. Modify `fetchCurrentWeather` in `src/lib/weatherapi.ts`
│       to accept lat/lon; remove `fetchCitySearch`
│       [depends on nothing external; breaks current/multiple routes temporarily]
└── C4. Update `/api/v1/weather/current` and `/multiple` routes
        to use coord params
        [depends on C2, C3]

Phase D — Client Layer (depends on Phase B + C being stable)
├── D1. Update `useLocalStorage.ts` to store/read `CityEntry[]`
│       [depends on B1]
├── D2. Update `useWeather.ts` to accept `CityEntry[]`, build coord URLs
│       [depends on B1, D1, C4]
├── D3. Update `SearchBar.tsx` to emit `CityEntry` via `onAddCity`
│       [depends on B1; onAddCity prop type changes]
└── D4. Update `WeatherGrid.tsx` key logic
        [depends on B1, D2]

Phase E — Integration Test
└── E1. Local smoke test: search → select → dashboard populates with coord-fetched weather
```

### Critical path

The critical dependency is `CityEntry` (B1). Every other change — server routes, client
hooks, components — flows from this type. Define the interface first and commit it before
writing any implementation.

The second chokepoint is `fetchCurrentWeather` signature (C3). Both `/current` and
`/multiple` routes call it. Change the signature once, update both callers in the same
commit to avoid a broken intermediate state.

### Parallelizable work

Once types (B1) are defined:
- C1 (cities search SQLite), C2 (validation), C3+C4 (weather routes with coords) can be
  worked in parallel by different developers
- D1 (localStorage), D3 (SearchBar) can be worked in parallel

D2 (useWeather) and D4 (WeatherGrid) should come last as they depend on both server and
storage changes being stable.

---

## Anti-Patterns to Avoid

### Storing lat/lon in the weather/multiple URL as comma-separated

`?cities=13.75,100.517,48.86,2.35` is ambiguous — is this two cities or four
coordinates? Use a different delimiter for the city separator (pipe `|`) and a different
delimiter for lat/lon within a pair (colon `:`).

### Opening a new Database() handle per request

This leaks file descriptors and defeats synchronous efficiency. Use the module-level
singleton in `src/lib/db.ts`.

### Putting cities.db in public/

Exposes the full city dataset as a publicly downloadable binary. Use `data/` at the
project root instead.

### Using __dirname to locate cities.db

In Next.js, `__dirname` inside a compiled route handler points into `.next/server/`, not
the project root. Use `process.cwd()` instead.

### Changing WeatherData to include lat/lon

`WeatherData` is an API response model for weather data. Lat/lon is a city lookup
concern and belongs in `CityEntry`. Mixing them creates a coupling between city identity
and weather results that complicates caching and retry logic.

### Keeping fetchCitySearch as a weatherapi fallback

Fallback logic means some CityEntry objects from weatherapi lack `id`, `lat`, `lon` —
breaking the coordinate-first fetch for those cities. Remove cleanly; don't fall back.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| `process.cwd()` for DB path | HIGH | Verified against Next.js App Router behavior; NIXPACKS mounts project at cwd |
| `better-sqlite3` singleton pattern | HIGH | Standard Node.js module-level singleton; same pattern as existing cache.ts |
| NIXPACKS native module build | HIGH | NIXPACKS provides build tools by default; well-documented |
| `|` and `:` delimiter change | HIGH | Required to avoid ambiguity; coordinate strings contain commas and periods |
| CityEntry replacing string in localStorage | HIGH | The existing type guard already handles format mismatch gracefully |
| weatherapi.com accepting `?q=lat,lon` | MEDIUM | Documented behavior; not verified against live API in this session |
| data/ directory naming convention | MEDIUM | Conventional; no Next.js-specific reason to prefer it over other names |
