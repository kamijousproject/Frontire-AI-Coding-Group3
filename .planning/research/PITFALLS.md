# Domain Pitfalls: SQLite + Next.js 16 App Router on Railway

**Domain:** Adding better-sqlite3 to an existing Next.js 16 App Router project on Railway NIXPACKS
**Researched:** 2026-05-12
**Stack:** Next.js 16.2.6 / React 19 / TypeScript 5 / Railway NIXPACKS / better-sqlite3

---

## Critical Pitfalls

Mistakes that cause silent failures, build breaks, or production outages.

---

### CRITICAL-1: Not declaring better-sqlite3 in serverExternalPackages

**What goes wrong:** Next.js 16 App Router bundles all server code through webpack by default. `better-sqlite3` is a native `.node` binary — it cannot be bundled by webpack. The build either fails outright or produces a broken bundle that crashes on `require()` at runtime with `Error: The module '.../better_sqlite3.node' was compiled against a different Node.js version`.

**Why it happens:** Next.js 16 renamed the config key from `serverComponentsExternalPackages` (Next.js 14/15 experimental) to `serverExternalPackages` (Next.js 15+ stable). Tutorials from 2023–2024 often show the old name. Using the wrong key silently does nothing — webpack still bundles the module, and the error only appears at runtime.

**Consequence:** Silent build success, runtime crash on first DB query in production.

**Prevention:** In `next.config.ts`, explicitly declare `serverExternalPackages`:

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}
```

**Verification:** `better-sqlite3` appears in Next.js 16's auto-exemption list (confirmed in official Next.js 16.2.6 docs), meaning it *may* work without explicit declaration — but the auto-list can lag behind versions. Always declare it explicitly. Do not use `serverComponentsExternalPackages` (old name).

**Phase to address:** Phase 1 (DB module setup) — day zero, before writing any DB code.

**Confidence:** HIGH — Verified against Next.js 16.2.6 official docs.

---

### CRITICAL-2: DB file path breaks in production (process.cwd() vs repo root)

**What goes wrong:** In development `next dev`, `process.cwd()` resolves to the repo root where `cities.db` lives. In Railway's `next start` production build, `process.cwd()` is still the repo root (since NIXPACKS does not use `output: 'standalone'`), so this specific deployment works correctly. The trap is:

1. Using `__dirname` in an App Router Route Handler — `__dirname` resolves to the `.next/server/app/api/...` compiled output directory, not the repo root. `cities.db` will not be found.
2. Placing `cities.db` in `src/` and constructing a relative path from `__dirname` — same problem.
3. Using `path.join(__dirname, '../../../cities.db')` — fragile, breaks if Next.js changes compilation depth.

**Why it happens:** App Router Route Handlers are compiled to `.next/server/app/api/...` — multiple directories deep from the repo root. `__dirname` reflects the compiled location.

**Consequence:** `Error: ENOENT: no such file or directory` on the first DB open call in production. Works in dev, fails in prod — hard to debug without knowing the distinction.

**Prevention:**
- Place `cities.db` at the repo root (e.g., `/cities.db` or `/data/cities.db`).
- Always use `process.cwd()` to construct the path, never `__dirname`:

```ts
import path from 'path'
const DB_PATH = path.join(process.cwd(), 'cities.db')
```

- Verify the path resolves correctly in CI by adding a startup log of the resolved path during development.

**Phase to address:** Phase 1 (DB module setup). Establish path convention before any DB code is written.

**Confidence:** HIGH — Based on Next.js App Router compilation behavior (official docs) and known `__dirname` semantics in compiled Node.js modules.

---

### CRITICAL-3: better-sqlite3 native compilation fails in NIXPACKS if build tools are absent

**What goes wrong:** `better-sqlite3` requires `node-gyp` to compile a native C++ addon during `npm install`. NIXPACKS automatically includes `python3`, `make`, and `gcc` for Node.js projects that have native dependencies — but only when NIXPACKS detects them. If detection fails (e.g., missing `binding.gyp` signal in package-lock), the build tools may be absent and `npm install` fails with:

```
gyp ERR! find Python
gyp ERR! configure error
```

**Why it happens:** NIXPACKS heuristically detects native addon dependencies. Projects that list `better-sqlite3` in `dependencies` (not `devDependencies`) are usually detected correctly, but the detection is not guaranteed.

**Consequence:** Build fails on Railway. The app never deploys.

**Prevention:**
- Add `better-sqlite3` to `dependencies` (not `devDependencies`).
- If build fails, add a `nixpacks.toml` at the repo root to explicitly include build tools:

```toml
[phases.setup]
nixPkgs = ["python3", "gcc", "gnumake"]
```

- Alternative: Consider `@sqlite.org/sqlite-wasm` (pure WASM, no compilation) as a fallback if native compilation repeatedly fails — though it has different API ergonomics than `better-sqlite3`.

**Phase to address:** Phase 1 (DB module setup). Validate Railway build succeeds with `better-sqlite3` installed before writing any application code.

**Confidence:** MEDIUM — NIXPACKS behavior is not fully documented for all native modules. The `nixpacks.toml` override is the reliable recovery path. Needs validation on first Railway deploy.

---

### CRITICAL-4: localStorage schema change breaks existing user data silently

**What goes wrong:** The current `useLocalStorage.ts` stores `string[]` of lowercase city names (e.g., `["london", "paris"]`). v1.1 needs to store city objects with lat/lon to enable coordinate-based weather lookups. If the storage key `weather_cities` is reused with a new shape (e.g., `{name, lat, lon}[]`), existing users with the old `string[]` format will hit the existing `readFromStorage()` guard which filters to only strings — silently dropping all saved cities on first load under the new code.

**Actual code path (confirmed from `useLocalStorage.ts`):**
```ts
.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
```
If v1.1 writes objects but the old guard filters for strings, existing data is silently discarded and an empty array is returned.

**Why it happens:** The new code writes objects, old guard rejects them, `cities` resets to `[]`. No error is thrown. User's saved cities vanish on next visit.

**Consequence:** Every existing user loses their saved dashboard on upgrade. No error visible in console by default (silent `catch { return [] }` pattern is already in place).

**Prevention — Option A (schema version guard + migration):**
Add a version field to storage. On read, detect old format and migrate:

```ts
const STORAGE_KEY = 'weather_cities'
const STORAGE_VERSION = 2

type CityRecord = { name: string; lat: number; lon: number; country: string }
type StorageShape = { version: number; cities: CityRecord[] }

function readFromStorage(): CityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    // v1 format: plain string[]
    if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === 'string')) {
      // Old format — discard (cannot recover lat/lon from city name alone)
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    // v2 format
    const shaped = parsed as StorageShape
    if (shaped.version !== STORAGE_VERSION) return []
    return shaped.cities.slice(0, MAX_CITIES)
  } catch {
    return []
  }
}
```

**Prevention — Option B (new storage key):**
Use a different key (`weather_cities_v2`) to avoid collision entirely. Simpler, no migration logic needed. Old key is orphaned in localStorage (harmless).

**Recommendation:** Use Option B (new key) because you cannot recover lat/lon from a plain city name string — migration to the new schema requires a DB lookup anyway, which cannot run during synchronous `localStorage.getItem`. A clean break with a new key is correct here.

**Phase to address:** Phase 2 (localStorage schema change). Must be planned before touching `useLocalStorage.ts`.

**Confidence:** HIGH — Based on direct code reading of `useLocalStorage.ts` and the schema incompatibility.

---

## Moderate Pitfalls

Mistakes that cause bugs or significant rework but not outright failure.

---

### MOD-1: Hot-reload creates multiple DB connections in dev mode

**What goes wrong:** In `next dev`, React Fast Refresh and Next.js HMR re-execute server module files on each change. If `new Database(DB_PATH)` is called at module level (top of the file), each hot reload opens a new connection without closing the previous one. `better-sqlite3` holds a file lock, so excess connections accumulate until the dev server restarts or hits OS file descriptor limits.

**Why it happens:** `better-sqlite3` connections are not automatically garbage-collected. Node.js module-level state is re-initialized on each HMR cycle in dev mode, but the previous module instance is not cleanly destroyed.

**Consequence:** Dev server becomes slow over a long session; possible `SQLITE_BUSY` errors on writes (not relevant for read-only city DB, but still bad practice). File descriptor exhaustion on Linux after many reloads.

**Prevention:** Use the Node.js global object to persist a singleton connection across HMR cycles:

```ts
// lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'cities.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined
}

function getDb(): InstanceType<typeof Database> {
  if (!global.__db) {
    global.__db = new Database(DB_PATH, { readonly: true })
    global.__db.pragma('journal_mode = WAL')
  }
  return global.__db
}

export { getDb }
```

The `global.__db` pattern survives HMR without leaking connections. The `readonly: true` flag is safe here — the city DB is never written to at runtime.

**Phase to address:** Phase 1 (DB module setup). Implement singleton pattern from the start.

**Confidence:** HIGH — Standard Next.js pattern for singleton resources in dev mode (same pattern used for Prisma, mongoose, etc.).

---

### MOD-2: Autocomplete dropdown shows stale results after fast input

**What goes wrong:** The existing `SearchBar.tsx` has a 300ms debounce (confirmed in code). When the city search backed by SQLite (local, near-instant), 300ms is too long — users see the previous query's results briefly displayed while the new query is already complete. More critically: if two debounce calls fire close together (rapid paste + backspace), the second fetch response can arrive before the first, rendering wrong results for the current input.

**Why it happens:** Current code does not cancel the in-flight fetch when a new query fires. The existing `debounceRef` only cancels the *timer*, not any already-dispatched fetch. With the live API (300ms+ network latency), responses arrive in order by coincidence. With SQLite (< 5ms query time), responses can arrive out of order.

**Consequence:** Dropdown shows cities for the previous query string. User selects a city that does not match what they typed. Subtle data corruption in the city list.

**Prevention:**
1. Use an `AbortController` per fetch, cancel it when a new debounce fires:

```ts
const abortRef = useRef<AbortController | null>(null)

// Inside debounce handler:
if (abortRef.current) abortRef.current.abort()
abortRef.current = new AbortController()
const res = await fetch(url, { signal: abortRef.current.signal })
```

2. Reduce debounce to 100–150ms now that the source is local SQLite (no network round-trip). 300ms is tuned for external API calls.

3. Use a request ID counter to discard out-of-order responses as a belt-and-suspenders:

```ts
const reqId = useRef(0)
// before fetch:
const id = ++reqId.current
// after response:
if (id !== reqId.current) return // stale
```

**Phase to address:** Phase 3 (SearchBar upgrade). Implement AbortController and reduced debounce when switching to SQLite backend.

**Confidence:** HIGH — Race condition is mechanical; confirmed by reading existing SearchBar code.

---

### MOD-3: Weather API call fails silently when city key changes from name to coordinates

**What goes wrong:** The current `useWeather.ts` passes city names (`"london"`) to `/api/v1/weather/multiple?cities=london,paris`. The existing cache in `cache.ts` keys on city name. If v1.1 switches to lat/lon coordinates (`"51.5074,-0.1278"`), the cache key changes, bypassing all warm cache entries. Old cities already saved in localStorage (string names) will call the weather API with a coordinate string that was never cached.

**More dangerous:** `fetchCurrentWeather()` in `weatherapi.ts` calls `q=${encodeURIComponent(city)}`. weatherapi.com accepts lat/lon in the `q` parameter — but the format must be `"51.5074,-0.1278"` (no spaces). If the coordinate is passed as a poorly formatted string, weatherapi.com returns HTTP 400 ("City not found"), which maps to `code: 1001` and a permanent error state for that city.

**Why it happens:** The data shape change (name → coordinate) ripples across: localStorage schema, weather hook, API route, cache key, and weatherapi.com query format. Each layer assumes the city identifier format.

**Consequence:** All existing cached weather data is bypassed (cache miss storm on first load after upgrade). Poorly formatted coordinates cause phantom "City not found" errors. Users see error cards for cities they successfully added.

**Prevention:**
1. Standardize the coordinate format early: `"${lat},${lon}"` with no spaces, using `toFixed(4)` to avoid floating-point string variability (`51.50740000000001`).
2. Update the cache key to use the coordinate string, not city name. The cache `get/set` in `cache.ts` is already keyed by the string passed — no code change needed if the coordinate is passed consistently.
3. Validate the `q` parameter in `/api/v1/weather/current` and `/api/v1/weather/multiple` to accept both `name` and `lat,lon` formats during the transition. After full migration, narrow validation.
4. Treat the localStorage v2 schema migration (CRITICAL-4) and this API change as a single atomic phase — do not ship one without the other.

**Phase to address:** Phase 2 (localStorage schema + API integration). Coordinate format must be locked before any weather fetch code is touched.

**Confidence:** HIGH — Based on direct code reading of `weatherapi.ts`, `cache.ts`, and weatherapi.com query parameter behavior.

---

### MOD-4: cities.db not tracked in git or missing from Railway deploy artifact

**What goes wrong:** If `cities.db` is listed in `.gitignore` (common practice to ignore binary files or generated artifacts), it will not be pushed to the remote repo and will not be present in Railway's build context. The build succeeds but `new Database(DB_PATH)` throws `ENOENT` at runtime.

**Why it happens:** `.gitignore` templates often include `*.db` to avoid committing SQLite databases. The `cities.db` for this project is a static, versioned data file (not a runtime-generated database), so it should be tracked in git.

**Consequence:** Build succeeds, app deploys, every `/api/cities/search` call throws 500.

**Prevention:**
1. Check `.gitignore` before committing `cities.db`. If `*.db` is listed, add an explicit override:
   ```gitignore
   *.db
   !cities.db
   ```
2. Verify Railway deployment has the file: add a startup health check that opens the DB and counts rows.
3. Name the file `cities.db` (not `data.db` or `database.db`) to make it clear it is a static asset.

**Phase to address:** Phase 1 (DB module setup). Check `.gitignore` on the same commit that adds `cities.db`.

**Confidence:** HIGH — Standard gotcha with static SQLite files in Node.js projects.

---

### MOD-5: CitySearchResult type missing lat/lon causes ripple rework

**What goes wrong:** The existing `CitySearchResult` interface (confirmed in `types/weather.ts`) has only `{name, region, country}`. The v1.1 goal requires lat/lon to be carried from search result selection through to the weather API call. If the type is not updated in the first phase of v1.1, every subsequent layer (SearchBar, useWeather, localStorage hook, weather API call) will need its interface updated in separate passes, causing cascading rework.

**Why it happens:** The type was designed for the v1.0 weatherapi.com city search, which did not return coordinates. SQLite `cities.db` will include lat/lon natively.

**Consequence:** Phases that assume the old type will compile but carry no coordinate data. The coordinate-based weather call either gets `undefined` lat/lon or falls back to city name (defeating the purpose).

**Prevention:** Define the new `CityRecord` type (with lat/lon) at the start of v1.1 and update `CitySearchResult` or add a new type alongside it. Drive all downstream changes from the type definition outward. Do not patch types layer-by-layer.

**Phase to address:** Phase 1 (DB module setup / type definitions). Types first, implementation second.

**Confidence:** HIGH — Confirmed by reading `types/weather.ts` and the v1.1 requirements.

---

## Minor Pitfalls

Small mistakes that add friction but are easily corrected.

---

### MIN-1: SQLite LIKE query is case-sensitive by default

**What goes wrong:** SQLite's `LIKE` operator is case-insensitive for ASCII but case-sensitive for non-ASCII characters (accented city names: "São Paulo", "Zürich"). A search for "sao" may not match "São Paulo" depending on how the DB was populated.

**Prevention:** Store a normalized lowercase ASCII column (`name_search`) alongside the display name. Query against `name_search` using `LIKE ?` with the lowercased query. Use `%query%` for substring match, `query%` for prefix match (prefix is faster with a B-tree index).

**Phase to address:** Phase 1 (DB population/schema). Define this column before importing data.

**Confidence:** MEDIUM — SQLite Unicode collation behavior is version-dependent. Normalize at import time to sidestep it entirely.

---

### MIN-2: Dropdown list key uses array index (existing bug, will worsen)

**What goes wrong:** Current `SearchBar.tsx` uses `key={i}` (array index) for dropdown results. When results update on keypress, React may reuse DOM nodes incorrectly, causing flickering or incorrect focus state in the dropdown. This is tolerable with few results but becomes visible when results update rapidly (SQLite is faster than the live API).

**Prevention:** Use a stable key like `key={`${r.name}-${r.country}`}` or a city ID from the DB.

**Phase to address:** Phase 3 (SearchBar upgrade). Fix alongside the AbortController change.

**Confidence:** HIGH — Confirmed by reading SearchBar.tsx `key={i}`.

---

### MIN-3: `readonly: true` omitted on DB open — accidental writes possible

**What goes wrong:** `better-sqlite3` defaults to read-write mode. The city DB is never mutated at runtime. Opening without `readonly: true` means any programming mistake (accidentally running an INSERT/UPDATE) silently modifies the DB file. On Railway, the container filesystem is ephemeral — changes are lost on restart — but the corrupted data can cause queries to return unexpected results during a single session.

**Prevention:** Always open with `{ readonly: true }`:
```ts
new Database(DB_PATH, { readonly: true })
```

**Phase to address:** Phase 1 (DB module setup).

**Confidence:** HIGH.

---

### MIN-4: Missing input trim on autocomplete query corrupts SQLite LIKE

**What goes wrong:** If the user pastes a city name with leading/trailing spaces (e.g., `" Paris "`), the raw value hits the SQLite `LIKE '%  Paris %'` query with extra spaces, returning zero results. The user sees "No cities found" for a valid city name.

**Prevention:** Trim the query value before the fetch:
```ts
const trimmed = val.trim()
if (trimmed.length < 2) { ... return }
// fetch with trimmed
```

**Phase to address:** Phase 3 (SearchBar upgrade). Already partially handled by the `normalize()` function in `useLocalStorage.ts`, but the SearchBar itself does not trim before querying.

**Confidence:** HIGH — Confirmed by reading SearchBar.tsx `handleChange`.

---

## Phase-Order Warning: The Riskiest Ordering Mistake

**The mistake:** Implementing the SearchBar autocomplete UI (Phase 3) before the localStorage schema migration (Phase 2) is complete. Teams do this because the UI is more visually satisfying to build first.

**What breaks:** The SearchBar selects a city and calls `onAddCity(result.name)` — passing a city *name string*, not a city object with coordinates. `useLocalStorage` stores the name. Weather fetch uses the name. This appears to work — but it leaves the v1.0 code path intact. Phase 2 (coordinate-based weather fetch) then cannot be connected without ripping out Phase 3 work.

**Correct phase order:**
1. DB setup (`cities.db`, `lib/db.ts`, path, singleton) — validates Railway build
2. Type update (`CityRecord` with lat/lon, new storage key, updated `useLocalStorage`)
3. API route (`/api/cities/search` queries SQLite, returns lat/lon in results)
4. Weather API integration (coordinate-based fetch, cache key update)
5. SearchBar upgrade (AbortController, reduced debounce, passes city object not just name)
6. End-to-end validation

**Rationale:** Each layer must accept coordinates before the next layer can pass them. Data shape flows from DB schema → type definitions → API route → SearchBar → localStorage → weather fetch. Build in that direction. Do not build UI until the data contract is fully defined and the API returns the right shape.

**Confidence:** HIGH — This ordering is derived from the dependency graph of the actual codebase.

---

## Phase-Specific Warning Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| DB module setup | Wrong config key (`serverComponentsExternalPackages`) | Use `serverExternalPackages` in next.config.ts |
| DB module setup | `__dirname` path breaks in production | Use `process.cwd()` only |
| DB module setup | Missing `cities.db` from git (blocked by `.gitignore`) | Add `!cities.db` override before first commit |
| DB module setup | HMR connection leak in dev | Global singleton with `global.__db` |
| DB module setup | `cities.db` not in Railway deploy | Verify with startup row count log |
| Type definitions | `CitySearchResult` missing lat/lon | Extend type before any implementation starts |
| localStorage migration | Silent discard of old string[] data | Use new storage key `weather_cities_v2` |
| Weather API integration | Coordinate format variability | `toFixed(4)` on lat/lon, no spaces |
| Weather API integration | Cache miss storm on schema change | Accept: first load after upgrade is cold |
| SearchBar upgrade | Race condition with fast input | AbortController per fetch, not just debounce |
| SearchBar upgrade | 300ms debounce too slow for local SQLite | Reduce to 100–150ms |
| SearchBar upgrade | `key={i}` causes flickering | Use stable city ID key |
| Phase ordering | UI before data contract | DB → types → API → weather → SearchBar |

---

## Sources

- Next.js 16.2.6 official docs — `serverExternalPackages` (confirmed `better-sqlite3` on auto-exemption list): https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages — HIGH confidence
- Next.js 16.2.6 official docs — self-hosting, process.cwd() and file system behavior: https://nextjs.org/docs/app/guides/self-hosting — HIGH confidence
- Codebase direct reading: `useLocalStorage.ts`, `SearchBar.tsx`, `types/weather.ts`, `weatherapi.ts`, `cache.ts`, all route handlers — HIGH confidence
- `railway.json` — NIXPACKS builder confirmed — HIGH confidence
- better-sqlite3 `readonly` and singleton patterns: training knowledge verified against library API — MEDIUM confidence for NIXPACKS-specific compilation behavior
