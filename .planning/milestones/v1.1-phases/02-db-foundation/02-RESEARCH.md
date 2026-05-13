# Phase 02: DB Foundation - Research

**Researched:** 2026-05-12
**Domain:** better-sqlite3 native module setup, Next.js 16 config, Node.js CSV-to-SQLite conversion script, Railway NIXPACKS native binary compilation
**Confidence:** HIGH (config keys, singleton pattern, gitignore, CSV schema) | MEDIUM (Railway NIXPACKS native build, nixpacks.toml exact package names)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** No indexes on the cities table. 7,300 rows means a full table scan completes in <1ms — no index is needed.
- **D-02:** Use `better-sqlite3 ^12.4.1` (not sql.js WASM). Sync API, no startup overhead, right choice for a read-only 7K-row dataset accessed server-side only.
- **D-03:** DB file lives at `data/cities.db` (project root, not `public/`).
- **D-04:** Always resolve the DB path with `process.cwd()`: `path.join(process.cwd(), 'data', 'cities.db')`. Never use `__dirname`.
- **D-05:** Add `serverExternalPackages: ['better-sqlite3']` to `next.config.ts`. **CRITICAL:** Use `serverExternalPackages` (Next.js 15+), NOT `serverComponentsExternalPackages`.
- **D-06:** Add `outputFileTracingIncludes: { '/*': ['./data/cities.db'] }` to ensure DB file survives `next build` tracing.
- **D-07:** `src/lib/db.ts` is a process-level singleton using `global.__db` to survive HMR. Open with `{ readonly: true, fileMustExist: true }`.
- **D-08:** Schema: `id INTEGER PRIMARY KEY, name TEXT, city_ascii TEXT, country TEXT, region TEXT, lat REAL, lon REAL, timezone TEXT, population INTEGER`.
- **D-09:** Railway fallback: nixpacks.toml → cities.json + Array.filter if native compilation fails after two attempts.

### Claude's Discretion

- **CSV source file:** Commit `data/worldcities.csv` to the repo so any developer can regenerate `cities.db` without a manual download step. (Preferred over documenting a download step.)
- **Railway validation approach:** A startup row-count log in `lib/db.ts` (visible in Railway logs) is a low-overhead approach to confirm `better-sqlite3` compiled correctly.

### Deferred Ideas (OUT OF SCOPE)

- `CityEntry` TypeScript type — needed in Phase 03; not added in Phase 02.
- Startup row-count validation log — may be added implicitly by the planner in `lib/db.ts`.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CITY-01 | `data/cities.db` SQLite file (~7,300 world cities) is committed to the repository and available at runtime on Railway | Verified: NIXPACKS copies full repo into image; `process.cwd()` resolves to project root; `outputFileTracingIncludes` makes it explicit for standalone deployments |
| CITY-02 | `scripts/build-cities-db.mjs` converts Simplemaps Basic CSV to a `cities.db` SQLite file with schema: `id, name, city_ascii, country, region, lat, lon, timezone, population` | Verified: Simplemaps Basic CSV columns map directly; Node.js built-in `fs` + `better-sqlite3` + manual CSV parse is sufficient; no extra runtime deps needed |

</phase_requirements>

---

## Summary

Phase 02 installs `better-sqlite3`, commits a pre-built `data/cities.db` (converted from Simplemaps Basic CSV via a one-time script), configures `next.config.ts` with the two required keys, and creates `src/lib/db.ts` as a process-level HMR-safe singleton. The phase gates all subsequent phases: nothing in Phase 03 or 04 works without a queryable DB at `data/cities.db` and a correct `next.config.ts`.

The single largest risk is `better-sqlite3` native compilation on Railway. The current `railway.json` specifies NIXPACKS (confirmed by reading the file). NIXPACKS provides build tools by default for Node projects, so the happy path is zero-config — but if detection fails, a `nixpacks.toml` override is the documented recovery. If that also fails, the fallback is pivoting the entire data layer to a JSON array, which is approximately 2–3 hours of rework and eliminates all native dependency risk.

The current `.gitignore` contains no `*.db` entry — `data/cities.db` will be tracked by git with no override needed. The `scripts/` directory does not yet exist and must be created as part of this phase.

**Primary recommendation:** Install `better-sqlite3` as a runtime dependency, commit the pre-converted `data/cities.db` and the source `data/worldcities.csv`, write `scripts/build-cities-db.mjs` as a standalone Node script invoked via `npm run build-db`, and confirm Railway build succeeds before closing the phase.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SQLite DB file storage | Build artifact / repo | — | Static committed file; Railway NIXPACKS bakes full repo into container image |
| DB connection management | API / Backend (Node.js server process) | — | `better-sqlite3` is synchronous; connection lives in server process global |
| next.config.ts keys | Build system / Frontend Server | — | `serverExternalPackages` affects webpack bundling; `outputFileTracingIncludes` affects build artifact collection |
| CSV-to-SQLite conversion | Local developer script | — | One-time pre-commit operation; not part of Railway build |
| Railway native compilation | Build system (NIXPACKS) | — | Happens during `npm install` in the Railway build phase |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-sqlite3` | `^12.9.0` (latest on npm as of 2026-04-12) | SQLite bindings for Node.js | Synchronous API, prebuilt binaries for LTS Node, `@types/` available, on Next.js auto-exempt list |
| `@types/better-sqlite3` | latest | TypeScript type definitions | Required for TypeScript strict mode; install as devDependency |
| Node.js built-in `fs` | (runtime) | Read CSV in build script | No extra dep needed for a one-time CSV read |
| Node.js built-in `path` | (runtime) | DB path construction | Required for `process.cwd()` path join |

**Version note:** `better-sqlite3` latest is 12.9.0 as of 2026-04-12 (verified: `npm view better-sqlite3 version`). The locked decision specifies `^12.4.1` which satisfies this. `^12.9.0` is equally valid. [VERIFIED: npm registry]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `csv-parse` | — | CSV parsing | NOT needed — manual split is sufficient for a one-time script with a known-format CSV |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `better-sqlite3` sync | `sql.js` WASM | WASM requires different server-side API, adds cold-start overhead. Rejected. |
| `better-sqlite3` sync | `sqlite3` async callbacks | Async/callback complexity for a synchronous read path. Rejected. |
| Manual CSV split | `csv-parse` | `csv-parse` is cleaner for edge cases but adds a devDependency to a one-time script. Manual split is fine for Simplemaps' well-formed CSV. |

**Installation:**
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Version verification:**
```bash
npm view better-sqlite3 version
# Output: 12.9.0 (verified 2026-04-12)
```

---

## Architecture Patterns

### System Architecture Diagram

```
[data/worldcities.csv]  (committed to repo, source of truth)
         |
         v (one-time: npm run build-db)
[scripts/build-cities-db.mjs]
         |  reads CSV with Node.js fs + manual split
         |  inserts rows via better-sqlite3 prepare().run()
         v
[data/cities.db]  (committed binary, ~300-500KB SQLite)
         |
         | (Railway NIXPACKS: npm install + npm run build)
         v
[Railway container image]  (data/cities.db present at process.cwd()/data/cities.db)
         |
         v (first request to any API route)
[src/lib/db.ts  getDb()]
         |  checks global.__db
         |  if null: new Database(process.cwd()/data/cities.db, { readonly, fileMustExist })
         v
[global.__db]  (Database instance, lives for process lifetime, survives HMR)
         |
         v (Phase 03+)
[/api/v1/cities/search/route.ts]
         |  getDb().prepare(SQL).all(q + '%')
         v
[CityEntry[]]  returned to browser
```

### Recommended Project Structure

```
project root/
├── data/
│   ├── worldcities.csv     # Simplemaps Basic source CSV (committed)
│   └── cities.db           # Generated SQLite binary (committed)
├── scripts/
│   └── build-cities-db.mjs # One-time CSV → SQLite conversion script
├── src/
│   └── lib/
│       └── db.ts           # better-sqlite3 singleton (new file)
├── next.config.ts          # Add serverExternalPackages + outputFileTracingIncludes
├── package.json            # Add better-sqlite3 dep + build-db script
└── nixpacks.toml           # Created only if Railway build fails (fallback)
```

### Pattern 1: next.config.ts with both required keys

**What:** Add `serverExternalPackages` to prevent webpack bundling and `outputFileTracingIncludes` to ensure the DB file is captured by output tracing.

**When to use:** Mandatory for any Next.js 15+ project using native Node.js modules.

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md
// Source: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prevents webpack from bundling better-sqlite3's native .node binary.
  // better-sqlite3 is on Next.js's auto-exempt list but explicit declaration
  // is required for correctness and future-proofing.
  serverExternalPackages: ['better-sqlite3'],

  // Ensures data/cities.db is included in output file tracing.
  // Not needed for Railway's npm run start (non-standalone) but correct belt-and-suspenders.
  outputFileTracingIncludes: {
    '/*': ['./data/cities.db'],
  },
}

export default nextConfig
```

**Key insight from official docs:** `outputFileTracingIncludes` keys are **route globs** matched against the route path (e.g., `'/*'` matches all routes), and values are **glob patterns resolved from the project root**. `'/*'` is the correct key to include a file for all routes. [VERIFIED: node_modules/next/dist/docs/.../output.md]

**Key insight from official docs:** `better-sqlite3` IS on Next.js 16's auto-exempt list (confirmed in bundled docs line 48: `- better-sqlite3`). However, explicit declaration is still required practice — the auto-list can lag or be overridden. Always declare it explicitly. [VERIFIED: node_modules/next/dist/docs/.../serverExternalPackages.md]

### Pattern 2: global.__db singleton with HMR safety

**What:** Module-level singleton using `global.__db` to survive Next.js Hot Module Replacement in dev mode.

**When to use:** Any long-lived resource (DB connection, Redis client) that should not be re-opened on each HMR cycle.

```typescript
// Source: .planning/research/PITFALLS.md MOD-1 + ARCHITECTURE.md Decision 2
// src/lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'cities.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined
}

export function getDb(): InstanceType<typeof Database> {
  if (!global.__db) {
    global.__db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
    })
  }
  return global.__db
}
```

**Why `global.__db` and not module-level `let _db`:** In `next dev`, HMR re-executes module files on each change. A module-level `let _db` is reset to `undefined` on each HMR cycle, opening a new connection without closing the previous one. `global.__db` persists across HMR cycles because the Node.js `global` object is not reset by HMR. [CITED: .planning/research/PITFALLS.md MOD-1]

**Why `fileMustExist: true`:** Throws a clear error at startup if `data/cities.db` is missing from the Railway image, rather than failing silently on the first query. [CITED: .planning/research/CONTEXT.md D-07]

### Pattern 3: scripts/build-cities-db.mjs — CSV to SQLite conversion

**What:** A standalone ESM Node.js script that reads `data/worldcities.csv` and writes `data/cities.db`.

**When to use:** Run once by a developer before first commit of `cities.db`. Also runnable to regenerate from the source CSV.

**Simplemaps Basic CSV column headers (actual):**
```
city, city_ascii, lat, lng, country, iso2, iso3, admin_name, capital, population, id
```

**Column mapping to DB schema:**

| CSV column | DB column | Notes |
|------------|-----------|-------|
| `id` | `id` | Integer primary key from Simplemaps |
| `city` | `name` | Display name (may include non-ASCII: "São Paulo") |
| `city_ascii` | `city_ascii` | Normalized ASCII name for prefix search in Phase 03 |
| `country` | `country` | Country name string |
| `admin_name` | `region` | State/province/admin region |
| `lat` | `lat` | REAL |
| `lng` | `lon` | Note: CSV column is `lng`, DB column is `lon` |
| `population` | `population` | INTEGER; may be empty string in CSV — coerce to 0 or NULL |

**Columns from CSV that are NOT in the DB schema:** `iso2`, `iso3`, `capital`

**Example implementation:**

```javascript
// scripts/build-cities-db.mjs
// Run: node scripts/build-cities-db.mjs
// Or:  npm run build-db

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const CSV_PATH = join(process.cwd(), 'data', 'worldcities.csv')
const DB_PATH = join(process.cwd(), 'data', 'cities.db')

const csv = readFileSync(CSV_PATH, 'utf-8')
const lines = csv.split('\n')
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

// Map header names to column indices
const col = (name) => headers.indexOf(name)

const db = new Database(DB_PATH)

db.exec(`
  DROP TABLE IF EXISTS cities;
  CREATE TABLE cities (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    city_ascii TEXT NOT NULL,
    country    TEXT NOT NULL,
    region     TEXT NOT NULL,
    lat        REAL NOT NULL,
    lon        REAL NOT NULL,
    timezone   TEXT NOT NULL DEFAULT '',
    population INTEGER NOT NULL DEFAULT 0
  );
`)

const insert = db.prepare(`
  INSERT INTO cities (id, name, city_ascii, country, region, lat, lon, timezone, population)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAll = db.transaction((rows) => {
  for (const row of rows) insert.run(...row)
})

const rows = []
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  // Simple CSV split — works for Simplemaps Basic which does not embed commas in fields
  // If fields may contain quoted commas, use a proper CSV parser
  const fields = line.split(',').map(f => f.replace(/^"|"$/g, ''))

  const id = parseInt(fields[col('id')], 10)
  const name = fields[col('city')] || ''
  const city_ascii = fields[col('city_ascii')] || ''
  const country = fields[col('country')] || ''
  const region = fields[col('admin_name')] || ''
  const lat = parseFloat(fields[col('lat')]) || 0
  const lon = parseFloat(fields[col('lng')]) || 0
  const timezone = ''  // Simplemaps Basic does not include timezone — use empty string
  const population = parseInt(fields[col('population')], 10) || 0

  if (!id || !name) continue
  rows.push([id, name, city_ascii, country, region, lat, lon, timezone, population])
}

insertAll(rows)
db.close()

console.log(`Built cities.db: ${rows.length} cities inserted at ${DB_PATH}`)
```

**IMPORTANT — timezone column:** The DB schema requires a `timezone` column, but Simplemaps Basic (free tier) does NOT include timezone in its CSV. The column will be populated as empty string `''` from the build script. Phase 03 (which reads from the DB) must handle an empty timezone gracefully. If timezone data is required for Phase 03's `CityEntry`, the research phase for Phase 03 must find an alternative source. [ASSUMED — Simplemaps Basic free tier columns verified via .planning/research/STACK.md which lists all columns; timezone is absent]

**IMPORTANT — CSV quoting:** Simplemaps CSVs quote fields that contain commas (e.g., city names with commas). The simple `split(',')` approach above may mis-split quoted fields. A more robust parser or a pre-processing step (strip quotes after split) may be needed. Validate by checking row count after import vs expected ~7,300. [ASSUMED — exact quoting behavior not verified against the actual CSV file]

**npm script to add to package.json:**
```json
"scripts": {
  "build-db": "node scripts/build-cities-db.mjs"
}
```

**How to run:** `npm run build-db` (run from project root). Must be run BEFORE `data/cities.db` is committed to the repo.

### Pattern 4: nixpacks.toml Railway fallback

**What:** Override NIXPACKS build configuration to explicitly include build tools for native module compilation.

**When to use:** Only if the first Railway deployment fails with `gyp ERR! find Python` or similar `node-gyp` errors.

```toml
# nixpacks.toml — place at repo root
[phases.setup]
nixPkgs = ["python311", "gcc", "gnumake"]
```

**Note on package names:** `python311` is the Nix package name for Python 3.11. If NIXPACKS uses a different Nix channel, the name may differ (e.g., `python3`, `python310`). Adjust if the override itself fails. [CITED: .planning/research/STACK.md — Recovery path A]

### Anti-Patterns to Avoid

- **Using `serverComponentsExternalPackages`:** The old name (Next.js 14/early 15 experimental) silently does nothing in Next.js 15+. Only `serverExternalPackages` is effective. [VERIFIED: bundled docs — "Renamed from `serverComponentsExternalPackages` to `serverExternalPackages`" at v15.0.0]
- **Using `__dirname` in db.ts:** App Router compiles route handlers into `.next/server/app/...` where `__dirname` points to the compiled location, not the project root. `process.cwd()` always resolves to project root in both dev and Railway.
- **Placing `data/cities.db` in `public/`:** Makes the binary publicly downloadable as a static asset.
- **Opening new Database() per request:** Leaks file descriptors. Use the global singleton.
- **Running the build script in `next build`:** `scripts/build-cities-db.mjs` is a one-time developer tool, not part of the Railway build. Do NOT add it to the `build` npm script.
- **Committing only `cities.db` without `worldcities.csv`:** If the source CSV is not committed, developers cannot regenerate the DB without a manual download.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQLite native bindings | Custom C addon | `better-sqlite3` | Native C++ correctness, prebuilt binaries, WAL support, prepared statements |
| CSV parsing | Manual regex split | `better-sqlite3` transactions + Node.js `fs` | One-time script; simple split sufficient for known-format Simplemaps CSV |
| HMR singleton management | Custom module cache | `global.__db` pattern | Standard Next.js pattern; well-documented; works reliably |
| DB path resolution | Custom env var | `process.cwd()` | Always correct in Next.js App Router; zero configuration needed |

**Key insight:** The only hand-rolling in this phase is the CSV parse in `build-cities-db.mjs` — and even there, a simple `split(',')` with quote-strip is sufficient for a one-time script processing a known-format file.

---

## Common Pitfalls

### Pitfall 1: Wrong next.config.ts key name (CRITICAL-1)

**What goes wrong:** Using `serverComponentsExternalPackages` instead of `serverExternalPackages`. The old key silently does nothing — webpack bundles the native binary and the app crashes at runtime on the first DB query.

**Why it happens:** Tutorials from 2023–2024 show the old experimental key name.

**How to avoid:** Use `serverExternalPackages` (stable since Next.js 15.0.0). Confirmed in bundled Next.js 16.2.6 docs.

**Warning signs:** App works in `next dev` but crashes in `next start` / Railway with `Error: The module '...better_sqlite3.node' was compiled against a different Node.js version`.

### Pitfall 2: `__dirname` in db.ts (CRITICAL-2)

**What goes wrong:** `path.join(__dirname, '../../data/cities.db')` works in dev but fails in production. App Router compiles route handlers into `.next/server/app/api/...` — `__dirname` resolves to the compiled output directory, not the project root.

**Why it happens:** Standard Node.js convention uses `__dirname`; App Router's compilation changes its meaning.

**How to avoid:** Always use `path.join(process.cwd(), 'data', 'cities.db')`.

**Warning signs:** `ENOENT: no such file or directory` error in Railway logs on first DB access; works fine in `next dev`.

### Pitfall 3: `cities.db` missing from Railway image (MOD-4)

**What goes wrong:** If `data/cities.db` is not committed to git (or blocked by `.gitignore`), it is absent from the Railway build context and the app crashes at startup.

**Why it happens:** Common to gitignore `*.db` files.

**How to avoid:** The current `.gitignore` has NO `*.db` entry — verified by reading the file. No override needed. Commit `data/cities.db` normally.

**Warning signs:** `fileMustExist: true` causes an immediate throw at `getDb()` first call, visible in Railway startup logs.

### Pitfall 4: Railway native compilation failure (CRITICAL-3)

**What goes wrong:** `npm install` fails with `gyp ERR! find Python` during Railway build.

**Why it happens:** NIXPACKS heuristically detects native dependencies; detection can fail, leaving out build tools.

**How to avoid:** `better-sqlite3` must be in `dependencies` (not `devDependencies`). If build still fails, add `nixpacks.toml` with Python/GCC/make.

**Warning signs:** Railway build log shows `node-pre-gyp` or `gyp ERR!` lines during `npm install`.

### Pitfall 5: HMR connection leak in dev mode (MOD-1)

**What goes wrong:** Without the `global.__db` pattern, each HMR cycle opens a new Database connection without closing the old one.

**Why it happens:** Next.js HMR re-executes module-level code; module-level `let` variables are reset.

**How to avoid:** Use `global.__db` as shown in Pattern 2 above.

**Warning signs:** Dev server becomes progressively slower; possible `SQLITE_BUSY` after many file saves.

### Pitfall 6: timezone column empty (data gap)

**What goes wrong:** The DB schema requires a `timezone TEXT` column but Simplemaps Basic CSV does not include timezone data. The column is populated as empty string `''`.

**Why it happens:** Simplemaps Basic free tier omits timezone.

**How to avoid:** Phase 03 must handle empty timezone in `CityEntry`. Document in build script output. Do not block Phase 02 on this — timezone is a Phase 03 concern.

**Warning signs:** Phase 03 search results return `timezone: ''` for all cities.

---

## Code Examples

### Complete next.config.ts

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md
// Source: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingIncludes: {
    '/*': ['./data/cities.db'],
  },
}

export default nextConfig
```

### Complete src/lib/db.ts

```typescript
// Source: .planning/research/PITFALLS.md MOD-1, ARCHITECTURE.md Decision 2
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'cities.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined
}

export function getDb(): InstanceType<typeof Database> {
  if (!global.__db) {
    global.__db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
    })
    // Optional: log row count at startup for Railway deployment validation
    const count = (global.__db.prepare('SELECT COUNT(*) as n FROM cities').get() as { n: number }).n
    console.log(`[db] cities.db opened: ${count} rows`)
  }
  return global.__db
}
```

**Note on the row-count log:** This satisfies the "Claude's Discretion" item from CONTEXT.md — it provides a Railway-visible startup confirmation that `better-sqlite3` compiled and the DB is queryable. The log fires on the first API call that uses `getDb()`, which happens in Phase 03. Phase 02 itself does not have an API caller, so this log validates at Phase 03 deploy time.

### package.json additions

```json
{
  "scripts": {
    "build-db": "node scripts/build-cities-db.mjs"
  },
  "dependencies": {
    "better-sqlite3": "^12.4.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "latest"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serverComponentsExternalPackages` | `serverExternalPackages` | Next.js 15.0.0 | Old key silently does nothing in 15+ |
| Per-request `new Database()` | Process-level `global.__db` singleton | Next.js App Router era | Prevents FD leak in dev, correct production behavior |
| `__dirname` for file paths | `process.cwd()` | App Router compile behavior | `__dirname` wrong in compiled Route Handlers |

**Deprecated/outdated:**
- `serverComponentsExternalPackages`: Renamed at Next.js 15.0.0. Using the old name silently fails.
- Opening SQLite per request: Incorrect pattern; use module-level singleton with `global.__db`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Simplemaps Basic CSV does not include a `timezone` column | Code Examples (build script), Pitfall 6 | If timezone IS in the CSV, the build script needs a column mapping update; DB schema matches requirements so risk is low |
| A2 | Simplemaps Basic CSV uses simple comma separation (some fields may be double-quoted but do not embed raw commas) | Code Examples (build script) | If city names contain unquoted commas, simple `split(',')` will mis-parse rows; row count check will catch this |
| A3 | NIXPACKS auto-provides Python/GCC/make for projects with native deps in `dependencies` | Pitfall 4, nixpacks.toml fallback | If detection fails, Railway build fails; recovery is adding nixpacks.toml (low risk, clear signal) |

---

## Open Questions (RESOLVED)

1. **Simplemaps CSV quoting edge cases** — RESOLVED
   - What we know: Simplemaps Basic CSV uses quotes around fields when needed (standard RFC 4180 CSV)
   - What's unclear: Whether any city/country/region names in the 7,300-row dataset embed a literal comma inside a quoted field
   - Resolution: After running `build-cities-db.mjs`, verify row count equals expected (~7,300). Plan 02-02 Task 2 includes an explicit row count acceptance criterion (7,000–7,500). If count is wrong, replace simple split with a quote-aware parser. Row count check is the recovery gate.

2. **Railway builder: NIXPACKS vs Railpack migration status** — RESOLVED
   - What we know: `railway.json` specifies `"builder": "NIXPACKS"` (verified by reading the file). NIXPACKS is explicitly locked.
   - What's unclear: Whether Railway has auto-migrated this service to Railpack despite the explicit config
   - Resolution: On first deploy, confirm the Railway dashboard shows NIXPACKS (not Railpack). If migrated, apply Railpack fallback: set env var `RAILPACK_BUILD_APT_PACKAGES=python3 g++ make` in Railway dashboard. This is a one-step recovery documented in STACK.md.

3. **better-sqlite3 prebuilt binary for Node.js 20 on Railway** — RESOLVED
   - What we know: Local dev environment runs Node.js 20.20.2 (verified). better-sqlite3 12.9.0 ships prebuilts for LTS Node versions.
   - What's unclear: Which Node.js version Railway's NIXPACKS image uses for this project; whether a prebuilt matches.
   - Resolution: Check Railway build logs for `node-pre-gyp install` vs compile. If prebuilt downloads: no action. If compile: ensure it completes (NIXPACKS provides Python/GCC by default for projects with native deps). If compile fails: add `nixpacks.toml` per D-09. This is a well-defined fallback chain with clear signals at each step.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `scripts/build-cities-db.mjs` | ✓ | v20.20.2 | — |
| `better-sqlite3` | `src/lib/db.ts`, build script | ✗ (not installed yet) | — | Install: `npm install better-sqlite3` |
| `data/worldcities.csv` | `scripts/build-cities-db.mjs` | ✗ (not in repo yet) | — | Download from simplemaps.com/data/world-cities (free, no account) OR commit as part of this phase |
| `data/` directory | `data/cities.db`, `data/worldcities.csv` | ✗ (does not exist) | — | Create: `mkdir data` |
| `scripts/` directory | `scripts/build-cities-db.mjs` | ✗ (does not exist) | — | Create: `mkdir scripts` |

**Missing dependencies with no fallback:**
- `data/worldcities.csv` must be obtained from Simplemaps before `build-cities-db.mjs` can run. The planner must include a step to either commit the CSV or document the download URL clearly.

**Missing dependencies with fallback:**
- None that block the phase beyond the above.

---

## Validation Architecture

> No `.planning/config.json` found — treating `nyquist_validation` as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project |
| Config file | None — see Wave 0 gap |
| Quick run command | `node scripts/build-cities-db.mjs` (smoke test via output + row count) |
| Full suite command | No automated test suite for this phase |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CITY-01 | `data/cities.db` exists and is queryable | Smoke test | `node -e "const D=require('better-sqlite3'); const db=D('./data/cities.db'); console.log(db.prepare('SELECT COUNT(*) as n FROM cities').get())"` | ❌ Wave 0 |
| CITY-02 | Build script produces valid schema | Smoke test | `npm run build-db` then row count check (embedded in script output) | ❌ Wave 0 (script itself) |

### Sampling Rate

- **Per task commit:** Run build script and verify row count log
- **Per wave merge:** Verify `data/cities.db` is tracked in git (`git ls-files data/cities.db`)
- **Phase gate:** Full Railway deployment attempt before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/build-cities-db.mjs` — covers CITY-02; written as part of this phase
- [ ] `data/` directory with `worldcities.csv` — prerequisite for CITY-02
- [ ] Framework install: N/A — no test framework required for this phase's deliverables; validation is by inspection and Railway deploy

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no (DB is read-only in this phase; search query validation is Phase 03) | — |
| V6 Cryptography | no | — |

**Security note for this phase:** `data/cities.db` is a read-only committed binary. No secrets, credentials, or PII are stored. The `{ readonly: true }` flag prevents accidental writes. The DB is not exposed directly to the browser (`public/` placement is explicitly rejected by D-03).

---

## Project Constraints (from CLAUDE.md / AGENTS.md)

CLAUDE.md was not found at the project root. AGENTS.md contains a single directive:

> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Applied:** All Next.js config keys in this research were verified against the bundled docs in `node_modules/next/dist/docs/` (Next.js 16.2.6), not from training knowledge.

**Confirmed from bundled docs:**
- `serverExternalPackages` is the correct stable key (v15.0.0+)
- `outputFileTracingIncludes` key format: route-glob keys, project-root-relative glob values
- `better-sqlite3` is on the auto-exempt list in Next.js 16 (but still declare explicitly)

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md` — `serverExternalPackages` key, auto-exempt list, v15.0.0 rename confirmed
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md` — `outputFileTracingIncludes` syntax, route-glob key format, project-root-relative values
- `npm view better-sqlite3 version` — version 12.9.0, published 2026-04-12 [VERIFIED: npm registry]
- `.planning/research/STACK.md` — better-sqlite3 choice rationale, Simplemaps column list, Railway fallback paths
- `.planning/research/ARCHITECTURE.md` — global.__db singleton pattern, process.cwd() path, build order
- `.planning/research/PITFALLS.md` — CRITICAL-1 through MOD-4 pitfall detail
- `.planning/phases/02-db-foundation/02-CONTEXT.md` — locked decisions D-01 through D-09
- `railway.json` — confirmed NIXPACKS builder
- `.gitignore` — confirmed no `*.db` entry; cities.db will be tracked

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — Railway NIXPACKS/Railpack fallback paths (community-confirmed, not official docs)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — better-sqlite3 version verified against npm registry; Next.js keys verified against bundled docs
- Architecture: HIGH — singleton pattern verified against existing lib files; path behavior verified against Next.js docs
- Pitfalls: HIGH (CRITICAL-1, CRITICAL-2, MOD-1, MOD-4) / MEDIUM (CRITICAL-3 Railway compilation) — most pitfalls verified against actual codebase or official docs
- CSV parsing: MEDIUM — Simplemaps column headers confirmed from prior research; exact quoting behavior unverified without the CSV file

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable stack; Next.js config API is unlikely to change in 30 days)
