# Technology Stack: v1.1 Local City Database + Instant Search

**Project:** Frontire AI — Weather Dashboard
**Milestone:** v1.1 (SQLite city database + coordinate-based weather lookup)
**Researched:** 2026-05-12
**Scope:** Additions and changes on top of the locked v1.0 stack. Everything in v1.0 is kept as-is unless noted.

---

## Locked v1.0 Stack (do not change)

These were validated in v1.0 and are not under review.

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 16.2.6 | App Router, API Route Handlers, build system |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x | Type system |
| TailwindCSS | 4.x (CSS-first) | Styling — no `tailwind.config.ts` |
| weatherapi.com | Free tier | Weather data source |
| Railway | Single instance | Deployment platform (Railpack builder — see note below) |

**Railway builder note (MEDIUM confidence):** Railway released Railpack as the successor to NIXPACKS in early 2025. As of 2026-05-12, Railway documentation still references both names and the migration is not fully complete for all projects. Your `railway.json` specifies the NIXPACKS builder explicitly. If Railway has auto-migrated your service to Railpack, the `nixpacks.toml` workaround (for native module compilation) documented in PITFALLS.md CRITICAL-3 must be replaced with Railpack-equivalent config. **Verify which builder your Railway service is using on first deploy.**

---

## v1.1 New Dependencies

### Primary: better-sqlite3

| Attribute | Value |
|-----------|-------|
| Package | `better-sqlite3` |
| Version | `^12.4.1` (latest stable as of research date) |
| Type annotation package | `@types/better-sqlite3` |
| License | MIT |
| Confidence | HIGH — library choice; MEDIUM — Railway native compilation behavior |

**Why better-sqlite3 and not alternatives:**

- Synchronous API: Route Handlers in Next.js App Router are `async` functions, but within them synchronous I/O is fine and eliminates the complexity of async iterator management. SQLite reads for city search are sub-millisecond; there is no benefit to async.
- Fastest SQLite binding for Node.js by benchmark. For a city name prefix search returning 5 rows, this is not a performance bottleneck at any scale, but the library's design (no async overhead, prepared statements, WAL pragma) is the right fit.
- Well-maintained: 16k+ GitHub stars, active releases, stable API surface since v7.
- Prebuilt binaries: `better-sqlite3` ships prebuilt binaries for LTS Node.js versions via `prebuildify`. On Railway/Linux-x64 with a supported Node.js version, `npm install` downloads the prebuilt binary and does not need to compile. If the prebuilt binary does not match (unsupported Node version or architecture), `npm install` falls back to `node-gyp` compilation — which requires build tools.

**Why not the alternatives:**

| Alternative | Why rejected |
|-------------|-------------|
| `sqlite3` (TryGhost/node-sqlite3) | Async callback-based API; adds unnecessary complexity for synchronous read-only queries. Requires the same native compilation. No advantage here. |
| `@sqlite.org/sqlite-wasm` | Pure WASM, zero native compilation — eliminates the Railway build risk entirely. However, WASM SQLite runs in the browser; server-side use requires a Node.js WASM runtime wrapper with a different API surface. Not worth the complexity change for a read-only city lookup. Keep as emergency fallback only. |
| Prisma + SQLite | ORM adds significant bundle overhead and a migration system not needed for a static read-only database. Overkill. |
| `sql.js` | Loads entire DB into memory as a WASM module. For a ~5,000-city DB (~300KB), memory is fine, but the WASM startup cost per cold start adds latency. Not needed. |
| In-memory JSON array | Eliminates SQLite entirely — load cities as a JSON file at startup, filter with `Array.filter`. For 5,000 cities with a simple prefix match, this is ~1ms and zero deployment risk. **This is the recommended fallback if Railway native compilation fails.** A pre-sorted JSON file is smaller than a SQLite binary (roughly 400KB JSON vs 500KB+ SQLite) and has zero native dependency. If `better-sqlite3` fails on Railway, pivot to this approach in one day. |

**Installation:**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Required next.config.ts change:**

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}
```

Without this, Next.js webpack bundles the native module and the app crashes at runtime. See PITFALLS.md CRITICAL-1.

---

### City Database: Simplemaps World Cities (Basic, free)

| Attribute | Value |
|-----------|-------|
| Source | https://simplemaps.com/data/world-cities |
| License | MIT (attribution appreciated, not required) |
| Format | CSV (convert to SQLite at build time, or download pre-converted) |
| Free tier city count | ~7,300 cities |
| Columns available | `city`, `city_ascii`, `lat`, `lng`, `country`, `iso2`, `iso3`, `admin_name` (region), `capital`, `population`, `id` |
| Approximate DB file size | ~300–500 KB for 7,300 rows after SQLite conversion |
| Confidence | MEDIUM — file size estimated; exact post-conversion size needs measurement |

**Why Simplemaps Basic (free) over alternatives:**

| Alternative | Count | Problem |
|-------------|-------|---------|
| dr5hn/countries-states-cities-database | 153,765 cities | 89 MB SQLite file — unacceptably large to commit to a git repo and bundle on Railway. 153K cities also returns too many ambiguous matches for a prefix search (multiple "Springfield" variants). |
| all-the-cities npm | ~138K cities | Same problem — large dataset; npm package adds binary to node_modules. |
| country-state-city npm | ~120K cities (minified JSON ~8MB) | 8MB JSON in node_modules; same over-inclusion problem. |
| weatherapi.com city search (v1.0) | unlimited | Live network call per keystroke — the problem v1.1 is solving. |
| Simplemaps Basic free | ~7,300 | Covers all major world cities users are likely to search for. Small file. MIT licensed. `city_ascii` column provides a ready-made normalized search column. Perfect fit. |

**The spec says "~5,000 major world cities"** — Simplemaps Basic at 7,300 slightly exceeds this and is acceptable. If the team prefers exactly 5,000, filter by `population > threshold` on import.

**Schema for cities.db:**

```sql
CREATE TABLE cities (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,          -- display name (e.g. "São Paulo")
  name_search TEXT NOT NULL,          -- normalized lowercase ASCII for LIKE queries
  country     TEXT NOT NULL,          -- "Brazil"
  region      TEXT NOT NULL,          -- admin_name / state / province
  lat         REAL NOT NULL,
  lon         REAL NOT NULL
);

CREATE INDEX idx_cities_name_search ON cities (name_search);
```

The `name_search` column holds `city_ascii` lowercased. Querying `name_search LIKE 'par%'` uses the B-tree index for prefix search. See PITFALLS.md MIN-1 for why this matters for non-ASCII city names.

**Data pipeline (one-time, pre-commit):**

1. Download `worldcities.csv` from Simplemaps (free, no account required).
2. Run a one-time Node.js script (`scripts/build-cities-db.mjs`) to import CSV → `cities.db`.
3. Commit `cities.db` to the repo root.
4. The script is kept in `scripts/` for reproducibility but does not run during `npm run build`.

**Verification: `.gitignore` does not block `cities.db`** — confirmed by reading the file. No `*.db` entry exists. The file will be tracked by git as-is.

---

### No Additional Runtime Dependencies

The following were considered and rejected:

| Package | Reason rejected |
|---------|----------------|
| `csv-parse` | Only needed in the one-time build script, not at runtime. Use Node.js built-in `fs.readFileSync` + manual CSV split for a simple one-time import, or add as a `devDependency` only. |
| `zod` | Validation for the search API route can be done with a 3-line regex + length check, consistent with how v1.0 validates all inputs. Adding zod for one new endpoint is disproportionate. |
| `fuse.js` / fuzzy search | Not needed. SQLite `LIKE 'query%'` prefix match on an indexed column is fast and accurate enough for city name search. Fuzzy matching introduces false positives ("Par" matching "Pearl"). |

---

## Required Configuration Changes

### next.config.ts

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Tell Next.js webpack NOT to bundle better-sqlite3 (it's a native .node binary)
  serverExternalPackages: ['better-sqlite3'],

  // Include cities.db in output file tracing so it's available at runtime
  // after next build (critical for Railway's npm run build && npm start)
  outputFileTracingIncludes: {
    '/*': ['./cities.db'],
  },
}

export default nextConfig
```

**Why `outputFileTracingIncludes` is needed:** Next.js uses `@vercel/nft` to statically trace files needed at runtime. A SQLite file opened via `new Database(process.cwd() + '/cities.db')` is not a static `import` — nft does not detect it. Without this config, a `next build` with `output: 'standalone'` would exclude `cities.db` from the build artifact. Railway does not use `output: 'standalone'` by default (it runs `npm run build && npm start` from the repo root), so the file is present at runtime anyway — but adding this config is belt-and-suspenders and correct for any future deployment change.

**Confidence:** HIGH — Verified against Next.js 16.2.6 official docs (outputFileTracingIncludes is stable in Next.js 15+, confirmed present in 16.x).

---

## Railway Build: The Native Binary Risk

**This is the item that must be verified manually on first deploy.**

### What the risk is

`better-sqlite3` is a native C++ addon. During `npm install`, npm downloads a prebuilt binary matching the current platform. Railway builds inside a Linux x64 container. If the prebuilt binary for the Railway Node.js version is available from the `better-sqlite3` release assets, `npm install` completes silently and correctly. If the prebuilt is not available (e.g., Railway uses a non-LTS Node.js version, or the Railpack/NIXPACKS build image has a different libc version), npm falls back to compiling from source via `node-gyp`. This compilation requires Python 3, `make`, and `g++` — which may not be present in the build image.

### What happens in each scenario

| Scenario | Build result | Action needed |
|----------|-------------|---------------|
| Prebuilt binary matches Railway Node/glibc | Build succeeds, no action needed | None |
| Prebuilt not found, build tools present | Compiles from source, build succeeds (slower) | None |
| Prebuilt not found, build tools absent (NIXPACKS) | `gyp ERR! find Python` — build fails | Add `nixpacks.toml` (below) |
| Prebuilt not found, build tools absent (Railpack) | `node-gyp not found` error — build fails | Set `RAILPACK_BUILD_APT_PACKAGES` env var (below) |

### Recovery path A — nixpacks.toml (if still on NIXPACKS)

Create at repo root:

```toml
[phases.setup]
nixPkgs = ["python311", "gcc", "gnumake"]
```

This instructs NIXPACKS to install Python 3.11, GCC, and GNU make before running `npm install`. Confirmed to resolve `gyp ERR!` failures in Railway community reports.

**Confidence:** MEDIUM — Pattern confirmed in Railway station threads; exact nix package names may differ by NIXPACKS version. Validate on first failing deploy.

### Recovery path B — Railpack environment variable (if migrated to Railpack)

In Railway dashboard, set the environment variable:

```
RAILPACK_BUILD_APT_PACKAGES=python3 g++ make
```

This injects build tool packages into the Railpack build phase before `npm install`. Reported in Railway community as the intended mechanism for native modules.

**Confidence:** LOW — Reported in community threads but not confirmed in official Railpack documentation as of research date. This mechanism may have changed. Check current Railpack docs if this fails.

### Recovery path C — Pivot to JSON (fallback, zero risk)

If both A and B fail after two deploy attempts, pivot the data layer to a JSON file:

- Replace `cities.db` with `cities.json` (array of `{name, name_search, country, region, lat, lon}`).
- Replace `lib/db.ts` with `lib/cities.ts` that loads the JSON at module init and uses `Array.filter` with a prefix match.
- Delete `better-sqlite3` dependency entirely.
- Total pivot time: ~2–3 hours.

For 5,000–7,300 cities, `Array.filter` on a prefix is ~1ms per query — acceptable. The JSON file at ~400KB is loaded once into memory at server startup.

**This is the recommended fallback. Do not spend more than two Railway deploy attempts debugging native compilation before pivoting to JSON.**

---

## Database File Placement

| Decision | Value | Reason |
|----------|-------|--------|
| File location | `cities.db` at repo root | `process.cwd()` in Next.js App Router resolves to the repo root in both dev and production (Railway `npm start`). Placing the file here means one path works everywhere. |
| Path construction | `path.join(process.cwd(), 'cities.db')` | Never use `__dirname` in App Router Route Handlers — it resolves to the compiled `.next/server/...` directory. See PITFALLS.md CRITICAL-2. |
| Build script output | `scripts/build-cities-db.mjs` writes `./cities.db` | Relative to the script's `process.cwd()` (repo root when run via `npm run build-db`). |

---

## TypeScript: New Types Required

The following types must be added or updated in `types/weather.ts` before any implementation work begins:

```ts
// New — replaces CitySearchResult for v1.1 results from SQLite
interface CityRecord {
  name: string;        // display name "São Paulo"
  country: string;     // "Brazil"
  region: string;      // "São Paulo" (state/province)
  lat: number;         // 4 decimal places, e.g. -23.5475
  lon: number;         // 4 decimal places, e.g. -46.6361
}

// Extends CityRecord for localStorage storage (v2 schema)
interface StoredCity extends CityRecord {
  // no additional fields — CityRecord is sufficient for storage
}

// Updated localStorage shape (new key: weather_cities_v2)
interface CityStorage {
  version: 2;
  cities: CityRecord[];
}
```

The existing `CitySearchResult` interface may be kept for backward compatibility during the transition, or aliased to `CityRecord` after the API route is updated.

---

## Confidence Summary

| Area | Confidence | Basis |
|------|------------|-------|
| better-sqlite3 as library choice | HIGH | Official docs, Context7, established usage pattern |
| `serverExternalPackages` config key | HIGH | Next.js 16.2.6 official docs |
| `outputFileTracingIncludes` behavior | HIGH | Next.js 16.2.6 official docs |
| `process.cwd()` path strategy | HIGH | Next.js App Router behavior, confirmed in docs and community |
| Simplemaps Basic free tier | MEDIUM | Website content (403 blocked direct scrape); city count and license from search results; file size estimated |
| Railway NIXPACKS `nixpacks.toml` recovery | MEDIUM | Community threads; not in official NIXPACKS docs |
| Railway Railpack `RAILPACK_BUILD_APT_PACKAGES` | LOW | Community threads only; not confirmed in official Railpack docs |
| better-sqlite3 prebuilt binary availability for Railway's Node version | MEDIUM | Prebuilts exist for LTS versions; Railway's exact Node version needs verification |

---

## Installation Commands

```bash
# Add runtime dependency
npm install better-sqlite3

# Add type definitions (dev only)
npm install -D @types/better-sqlite3

# (One-time) Build the cities.db from Simplemaps CSV
# Add this to package.json scripts: "build-db": "node scripts/build-cities-db.mjs"
npm run build-db
```

---

## Sources

- better-sqlite3 README and compilation docs: https://github.com/WiseLibs/better-sqlite3 — HIGH confidence (Context7 verified)
- Next.js 16.2.6 `serverExternalPackages` docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages — HIGH confidence
- Next.js 16.2.6 `outputFileTracingIncludes` docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/output — HIGH confidence (fetched directly)
- Railway station: better-sqlite3 native module failures: https://station.railway.com/questions/i-can-t-get-my-railway-image-working-wit-ec67ee4d — MEDIUM confidence
- Railway station: node-gyp not found on Railpack: https://station.railway.com/questions/node-gyp-not-found-5930f383 — MEDIUM confidence (community, not official docs)
- Railpack language docs (Node.js): https://railpack.com/languages/node/ — MEDIUM confidence
- Railway blog: Railpack introduction: https://blog.railway.com/p/introducing-railpack — HIGH confidence (official)
- Simplemaps world cities database: https://simplemaps.com/data/world-cities — MEDIUM confidence (403 on direct fetch; data from search results)
- dr5hn/countries-states-cities-database (rejected): https://github.com/dr5hn/countries-states-cities-database — HIGH confidence (fetched directly; 89MB SQLite confirmed)
