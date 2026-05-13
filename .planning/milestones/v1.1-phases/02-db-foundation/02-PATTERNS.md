# Phase 02: DB Foundation - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 6 (4 new, 2 modified)
**Analogs found:** 4 / 6 (data/worldcities.csv and data/cities.db are binary/data artifacts — no code analog applies)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/db.ts` | utility / singleton | request-response (lazy init) | `src/lib/cache.ts` + `src/lib/rate-limit.ts` | role-match (same module shape; no HMR global pattern exists yet) |
| `scripts/build-cities-db.mjs` | utility / build script | file-I/O (CSV → SQLite batch) | none in codebase | no analog |
| `next.config.ts` | config | — | `next.config.ts` (existing, currently empty) | exact (same file, modify-in-place) |
| `package.json` | config | — | `package.json` (existing) | exact (same file, modify-in-place) |
| `data/worldcities.csv` | data artifact | — | none | no analog |
| `data/cities.db` | data artifact | — | none | no analog |

---

## Pattern Assignments

### `src/lib/db.ts` (utility, lazy-init singleton)

**Analogs:** `src/lib/cache.ts` and `src/lib/rate-limit.ts`

These two files establish all the conventions for `src/lib/` server-side utilities in this codebase. `db.ts` follows the same shape but adds a `global.__db` guard for HMR safety (neither cache nor rate-limit need it because their module-level `Map` state is acceptable to reset; a Database connection is not).

**File header / doc-comment pattern** (`src/lib/cache.ts` lines 1-6):
```typescript
/**
 * Server-Side Cache
 * In-memory LRU-style cache for WeatherData with 10-minute TTL.
 * Keys are normalized to lowercase + trim for case-insensitive city lookup.
 */
```
Copy this block format for `db.ts`: one-liner summary, key facts as bullet sentences, no @param/@return JSDoc.

**Imports pattern** (`src/lib/cache.ts` lines 7-7, `src/lib/rate-limit.ts` has no imports):
```typescript
import type { WeatherData } from '../types/weather';
```
- Named type imports only; no default imports from project modules.
- Use `import type` for type-only imports.
- `db.ts` will need `import Database from 'better-sqlite3'` (default import — correct for this CommonJS-compatible package) and `import path from 'path'`.

**Module-level constant pattern** (`src/lib/cache.ts` lines 9-9, `src/lib/rate-limit.ts` lines 9-10):
```typescript
const TTL_MS = 600_000; // 10 minutes
```
```typescript
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;
```
- `SCREAMING_SNAKE_CASE` for module-level constants.
- Inline comment explains the human-readable meaning.
- `db.ts` follows this with: `const DB_PATH = path.join(process.cwd(), 'data', 'cities.db')`

**Module-level process state pattern** (`src/lib/cache.ts` line 16, `src/lib/rate-limit.ts` line 17):
```typescript
const store = new Map<string, CacheEntry>();
```
```typescript
const store = new Map<string, RateLimitEntry>();
```
- Process-level state is declared as a `const` at module scope.
- `db.ts` deviates from this intentionally: the singleton must survive HMR via `global.__db` instead of a plain `const`. Apply the `declare global` augmentation block before the exported function.

**Exported named function pattern** (`src/lib/cache.ts` lines 26-38, `src/lib/rate-limit.ts` lines 38-61):
```typescript
/**
 * Retrieve cached WeatherData for a city.
 * Returns null if not cached or if the entry has expired.
 */
export function get(city: string): WeatherData | null {
  const key = normalizeKey(city);
  const entry = store.get(key);

  if (!entry) return null;
  // ...
  return entry.data;
}
```
- Named exports only (no `export default` from `src/lib/` files).
- JSDoc on every exported function: one-sentence summary + bullet on return/side-effect.
- `db.ts` exports `export function getDb(): InstanceType<typeof Database>`.

**Early-throw / fail-loud pattern** (`src/lib/weatherapi.ts` lines 16-21):
```typescript
function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new Error('WEATHER_API_KEY env var is not set');
  }
  return key;
}
```
- Missing config throws immediately with a clear message — no silent fallback.
- `db.ts` replicates this via `{ fileMustExist: true }` on the Database constructor: missing `cities.db` throws at first `getDb()` call with a clear ENOENT error rather than returning an undefined handle.

**Complete `src/lib/db.ts` core pattern to copy** (from RESEARCH.md Pattern 2):
```typescript
/**
 * SQLite DB Singleton
 * Process-level singleton for better-sqlite3. Uses global.__db to survive
 * Next.js HMR in development without leaking file descriptors.
 * Opens read-only with fileMustExist — throws loudly at startup if cities.db is absent.
 */
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'cities.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined
}

/**
 * Return the process-level better-sqlite3 Database instance.
 * Opens and caches on first call; subsequent calls return the cached handle.
 */
export function getDb(): InstanceType<typeof Database> {
  if (!global.__db) {
    global.__db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
    })
    const count = (global.__db.prepare('SELECT COUNT(*) as n FROM cities').get() as { n: number }).n
    console.log(`[db] cities.db opened: ${count} rows`)
  }
  return global.__db
}
```
- `declare global` block with `// eslint-disable-next-line no-var` is required: ESLint strict mode disallows `var`, but `declare global` requires it.
- `console.log('[db] ...')` prefix convention: bracket-tagged log visible in Railway deployment logs. Matches no existing convention (no existing log in lib files) — introduce it fresh.
- No `export default` — consistent with all other `src/lib/` files.

---

### `next.config.ts` (config, modify-in-place)

**Analog:** `next.config.ts` (the file itself, currently lines 1-7)

**Current file** (`next.config.ts` lines 1-7):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Pattern to apply:** Replace the placeholder comment with the two required keys. Preserve the existing `import type { NextConfig } from "next"` import line and `export default nextConfig` export line exactly as-is. Only the object body changes.

**Target state after modification:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents webpack from bundling better-sqlite3's native .node binary.
  // Use serverExternalPackages (Next.js 15+), NOT serverComponentsExternalPackages.
  serverExternalPackages: ['better-sqlite3'],

  // Ensures data/cities.db is included in output file tracing for Railway.
  outputFileTracingIncludes: {
    '/*': ['./data/cities.db'],
  },
};

export default nextConfig;
```

- The file uses double-quotes (`"next"`) — maintain this quoting style.
- `export default nextConfig` is correct here (Next.js config requires default export).
- Add inline comments above each new key explaining the "why".

---

### `package.json` (config, modify-in-place)

**Analog:** `package.json` (the file itself, currently lines 1-26)

**Current scripts block** (`package.json` lines 5-10):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
},
```

**Current dependencies block** (`package.json` lines 11-15):
```json
"dependencies": {
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4"
},
```

**Current devDependencies block** (`package.json` lines 16-25):
```json
"devDependencies": {
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.2.6",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

**Additions to make:**

Add `"build-db": "node scripts/build-cities-db.mjs"` to `scripts` (after `"lint"`).

Add `"better-sqlite3": "^12.4.1"` to `dependencies` (runtime dep — NIXPACKS installs only `dependencies` during Railway build; if it were in `devDependencies` the native binary would not compile on Railway).

Add `"@types/better-sqlite3": "latest"` to `devDependencies`.

**Target additions in context:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "build-db": "node scripts/build-cities-db.mjs"
},
"dependencies": {
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "better-sqlite3": "^12.4.1"
},
"devDependencies": {
  "@tailwindcss/postcss": "^4",
  "@types/better-sqlite3": "latest",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.2.6",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

### `scripts/build-cities-db.mjs` (utility / build script, file-I/O batch)

**Analog:** None in codebase. `scripts/` directory does not yet exist.

**Reference pattern:** RESEARCH.md Pattern 3 (lines 258-328) is the authoritative reference. No codebase analog exists — planner uses the RESEARCH.md pattern directly.

**Key conventions to observe:**

1. **ESM `.mjs` extension** — Node.js ESM module. `import` syntax, not `require`. Use `import Database from 'better-sqlite3'`, `import { readFileSync } from 'fs'`, `import { join } from 'path'`.

2. **`process.cwd()` path construction** — consistent with `src/lib/db.ts`. Never `__dirname`.

3. **Batch insert via transaction** — `db.transaction(rows => { for row of rows insert.run(...row) })`. Bulk-wrapping inserts in a single transaction is the `better-sqlite3` performance pattern; avoids 7,300 individual commits.

4. **stdout confirmation line** — `console.log(\`Built cities.db: ${rows.length} cities inserted at ${DB_PATH}\`)` at the end. This is the smoke-test validation signal.

5. **No shebang line** — the script is invoked as `node scripts/build-cities-db.mjs`, not as a directly executable file. No `#!/usr/bin/env node` needed.

6. **Population coercion** — `parseInt(fields[col('population')], 10) || 0`. Empty string in CSV becomes 0 in the DB.

7. **Timezone empty string** — Simplemaps Basic does not include timezone; always write `''` for that column.

8. **`DROP TABLE IF EXISTS` before `CREATE TABLE`** — makes the script idempotent (safe to re-run).

**Complete script pattern to copy** (from RESEARCH.md lines 258-328 — reproduced for planner convenience):
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

  const fields = line.split(',').map(f => f.replace(/^"|"$/g, ''))

  const id = parseInt(fields[col('id')], 10)
  const name = fields[col('city')] || ''
  const city_ascii = fields[col('city_ascii')] || ''
  const country = fields[col('country')] || ''
  const region = fields[col('admin_name')] || ''
  const lat = parseFloat(fields[col('lat')]) || 0
  const lon = parseFloat(fields[col('lng')]) || 0
  const timezone = ''
  const population = parseInt(fields[col('population')], 10) || 0

  if (!id || !name) continue
  rows.push([id, name, city_ascii, country, region, lat, lon, timezone, population])
}

insertAll(rows)
db.close()

console.log(`Built cities.db: ${rows.length} cities inserted at ${DB_PATH}`)
```

**Validation note:** After running this script, verify `rows.length` is approximately 7,300. If significantly lower, the simple `split(',')` is mis-parsing quoted fields — upgrade to a quote-aware parser or install `csv-parse` as a devDependency for the script only.

---

### `data/worldcities.csv` (data artifact)

**Analog:** None. Binary/data artifact. No code pattern applies.

**Action:** Download from `https://simplemaps.com/data/world-cities` (Basic tier, free, no account required). Place at `data/worldcities.csv`. Commit to git. This file is the source of truth for regenerating `data/cities.db`.

---

### `data/cities.db` (data artifact)

**Analog:** None. Binary artifact. No code pattern applies.

**Action:** Generated by running `npm run build-db` after `worldcities.csv` is in place. Commit the generated binary. The current `.gitignore` has no `*.db` entry — no override needed.

---

## Shared Patterns

### Module File Structure (`src/lib/`)

**Source:** `src/lib/cache.ts` (lines 1-47), `src/lib/rate-limit.ts` (lines 1-61)
**Apply to:** `src/lib/db.ts`

All `src/lib/` files follow this structure in order:
1. Block doc-comment at top (summary + key facts)
2. `import type` statements (types only)
3. Third-party / Node built-in imports
4. Module-level constants in `SCREAMING_SNAKE_CASE`
5. Private interfaces (`interface FooEntry { ... }`)
6. Private helper functions (no export)
7. Exported named functions with JSDoc

```typescript
// Order established by cache.ts and rate-limit.ts:
// [1] block doc-comment
// [2] import type { ... } from '...'
// [3] const CONSTANT = value // inline comment
// [4] interface PrivateEntry { ... }
// [5] function privateHelper(...): ... { ... }
// [6] /** JSDoc */ export function publicFn(...): ... { ... }
```

No `export default` from `src/lib/` files. All exports are named.

### TypeScript Strict Mode Compatibility

**Source:** `src/lib/weatherapi.ts` (lines 53, 73), `src/lib/cache.ts` (line 7)
**Apply to:** `src/lib/db.ts`

- Use `// eslint-disable-next-line no-var` before `var __db` in `declare global`.
- Cast `db.prepare(...).get()` result with `as { n: number }` — `.get()` returns `unknown` in strict mode.
- No `any` casts without an `// eslint-disable-next-line` comment.

```typescript
// Pattern from weatherapi.ts line 73 — casting unknown API response:
const json: any = await response.json();

// Analogous pattern for db.ts — casting SQLite .get() result:
const count = (global.__db.prepare('SELECT COUNT(*) as n FROM cities').get() as { n: number }).n
```

### `process.cwd()` Path Resolution

**Source:** RESEARCH.md CRITICAL-2, confirmed by `src/lib/weatherapi.ts` convention (uses `process.env`, not `__dirname`)
**Apply to:** `src/lib/db.ts` and `scripts/build-cities-db.mjs`

Always construct file paths with `path.join(process.cwd(), ...)`. Never use `__dirname`. This applies to both the singleton and the build script.

```typescript
// Correct (works in dev, Railway, and compiled App Router):
const DB_PATH = path.join(process.cwd(), 'data', 'cities.db')

// Wrong (fails in compiled Route Handlers on Railway):
// const DB_PATH = path.join(__dirname, '../../data/cities.db')
```

### Fail-Loud Startup Validation

**Source:** `src/lib/weatherapi.ts` lines 16-21
**Apply to:** `src/lib/db.ts`

```typescript
// From weatherapi.ts — throw immediately if config is missing:
function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new Error('WEATHER_API_KEY env var is not set');
  }
  return key;
}
```

`db.ts` achieves the same with `fileMustExist: true` on the Database constructor — missing `cities.db` throws at first `getDb()` call instead of returning a broken handle.

### `next.config.ts` TypeScript Config Style

**Source:** `next.config.ts` lines 1-7 (current file)
**Apply to:** `next.config.ts` (modification)

```typescript
import type { NextConfig } from "next";   // double-quote, import type

const nextConfig: NextConfig = {
  // new keys go here
};

export default nextConfig;   // default export required by Next.js
```

Maintain double-quote string literals (consistent with existing file). The `NextConfig` type annotation on `nextConfig` provides compile-time validation of config keys.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/build-cities-db.mjs` | build script | file-I/O (batch) | No `scripts/` directory exists in codebase; no Node.js standalone scripts exist anywhere in the project |
| `data/worldcities.csv` | data artifact | — | Not a code file; sourced externally from Simplemaps |
| `data/cities.db` | data artifact | — | Not a code file; generated by build script |

For `scripts/build-cities-db.mjs`, the planner MUST use RESEARCH.md Pattern 3 (lines 258-328) as the reference implementation — no codebase analog exists.

---

## Metadata

**Analog search scope:** `src/lib/`, `next.config.ts`, `package.json`, project root
**Files scanned:** `src/lib/cache.ts`, `src/lib/rate-limit.ts`, `src/lib/weatherapi.ts`, `src/types/weather.ts`, `next.config.ts`, `package.json`
**Pattern extraction date:** 2026-05-12
**CLAUDE.md:** Not present. AGENTS.md directive applied: all Next.js config keys verified against `node_modules/next/dist/docs/` (Next.js 16.2.6).
