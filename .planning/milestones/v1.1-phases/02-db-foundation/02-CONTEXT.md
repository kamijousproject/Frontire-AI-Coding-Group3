# Phase 02: DB Foundation - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 02 delivers the SQLite city database foundation: `data/cities.db` committed to the repo, `scripts/build-cities-db.mjs` one-time conversion script, `better-sqlite3` installed as a runtime dependency, `next.config.ts` configured with `serverExternalPackages` and `outputFileTracingIncludes`, and `src/lib/db.ts` process-level singleton — all verified to work in Railway's NIXPACKS build environment.

**Not in scope:** city search API route, CityEntry type definition, localStorage migration, SearchBar UI — those belong to Phases 03–04.

</domain>

<decisions>
## Implementation Decisions

### SQLite Indexes
- **D-01:** No indexes on the cities table. 7,300 rows means a full table scan completes in <1ms — no index is needed. Keeps the build script simple and the DB schema minimal.

### DB Package & Path
- **D-02:** Use `better-sqlite3 ^12.4.1` (not sql.js WASM). Sync API, no startup overhead, right choice for a read-only 7K-row dataset accessed server-side only.
- **D-03:** DB file lives at `data/cities.db` (project root, not `public/`). Placing it in `public/` would expose the binary as a static download.
- **D-04:** Always resolve the DB path with `process.cwd()`: `path.join(process.cwd(), 'data', 'cities.db')`. Never use `__dirname` — App Router compiles handlers into `.next/server/app/...` where `__dirname` points to the wrong location.

### next.config.ts Configuration
- **D-05:** Add `serverExternalPackages: ['better-sqlite3']` to `next.config.ts`. This prevents webpack from bundling the native binary, which would cause a silent runtime crash. **CRITICAL:** Use `serverExternalPackages` (Next.js 15+), NOT the old `serverComponentsExternalPackages` key — the old name silently does nothing.
- **D-06:** Add `outputFileTracingIncludes: { '/*': ['./data/cities.db'] }` to ensure the DB file survives `next build` tracing and is available at runtime on Railway.

### DB Singleton Pattern
- **D-07:** `src/lib/db.ts` is a process-level singleton using `global.__db` to survive HMR. Open with `{ readonly: true, fileMustExist: true }` so any misconfiguration throws loudly at startup rather than silently.

### DB Schema
- **D-08:** Schema: `id INTEGER PRIMARY KEY, name TEXT, city_ascii TEXT, country TEXT, region TEXT, lat REAL, lon REAL, timezone TEXT, population INTEGER`. Column `city_ascii` stores the normalized ASCII name used for search in Phase 03.

### Railway Fallback
- **D-09:** If `better-sqlite3` native compilation fails after two attempts: (1) add `nixpacks.toml` with `nixPkgs = ["python3", "gcc", "gnumake"]`; (2) if still failing, pivot to `data/cities.json` + `Array.filter` prefix match (~2–3h rework, zero native dependencies).

### Claude's Discretion
- **CSV source file:** The planner decides where `build-cities-db.mjs` expects to find the Simplemaps Basic CSV (e.g., commit it at `data/worldcities.csv` or document that devs download it). Committing the CSV is preferred so any developer can regenerate `cities.db` without a manual download step.
- **Railway validation approach:** The planner decides how Phase 02 confirms that `better-sqlite3` compiled correctly before Phase 03 begins — e.g., a startup row-count log in `lib/db.ts` (visible in Railway logs) is a low-overhead approach.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — CITY-01 (cities.db committed), CITY-02 (build script schema)
- `.planning/ROADMAP.md` — Phase 02 goal, success criteria, and dependencies

### Research (Architecture & Pitfalls)
- `.planning/research/SUMMARY.md` — Architecture decisions, critical pitfalls, empirical validations
- `.planning/research/STACK.md` — better-sqlite3 install, next.config.ts keys, Railway NIXPACKS notes, JSON fallback
- `.planning/research/ARCHITECTURE.md` — DB singleton pattern, process.cwd() path resolution, build order
- `.planning/research/PITFALLS.md` — CRITICAL-1 (serverExternalPackages key), CRITICAL-2 (__dirname), CRITICAL-3 (Railway native compilation)

### Existing Code (Integration Points)
- `next.config.ts` — currently empty config; Phase 02 adds serverExternalPackages and outputFileTracingIncludes
- `src/lib/` — existing lib patterns (cache.ts, rate-limit.ts, weatherapi.ts) — db.ts follows the same file structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/cache.ts`, `src/lib/rate-limit.ts` — server-side module pattern with process-level state; `src/lib/db.ts` follows the same shape (module-level singleton, exported getter function)
- `src/types/weather.ts` — existing type file; `CityEntry` will be added here in Phase 03 (Phase 02 doesn't need it yet)

### Established Patterns
- Lib files in `src/lib/` export named functions (not default exports), import types from `src/types/weather.ts`
- `next.config.ts` uses TypeScript config (`NextConfig` type import) — maintain this pattern when adding keys

### Integration Points
- `next.config.ts` — two new keys: `serverExternalPackages` and `outputFileTracingIncludes`
- `package.json` — new dependency: `better-sqlite3` + `@types/better-sqlite3`
- `src/lib/db.ts` — new file; no existing code depends on it yet (all callers come in Phase 03)

</code_context>

<specifics>
## Specific Ideas

- Use `better-sqlite3 ^12.4.1` (version from research)
- `scripts/build-cities-db.mjs` uses Node.js built-in `better-sqlite3` to insert from CSV — no external tooling
- Simplemaps Basic dataset: ~7,300 cities, MIT license, includes `city_ascii` for normalized search

</specifics>

<deferred>
## Deferred Ideas

- **`CityEntry` TypeScript type** — needed in Phase 03 when the search route returns data; not added in Phase 02
- **Startup row-count validation log** — noted in REQUIREMENTS.md future items; if the planner adds a row-count log to `lib/db.ts`, it covers this implicitly

</deferred>

---

*Phase: 02-db-foundation*
*Context gathered: 2026-05-12*
