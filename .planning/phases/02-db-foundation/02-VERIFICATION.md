---
phase: 02-db-foundation
verified: 2026-05-12T09:12:52Z
status: human_needed
score: 7/8 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Deploy to Railway and confirm the NIXPACKS build completes without better-sqlite3 native compilation errors"
    expected: "Railway build log shows better-sqlite3 native binary compiled successfully; npm run start brings the app online with '[db] cities.db opened: 7300 rows' visible in Railway deployment logs"
    why_human: "Cannot trigger or observe a Railway cloud build from the local environment. All local mitigations are in place (better-sqlite3 in dependencies, serverExternalPackages set, native binary compiles locally), but the SC-3 success criterion explicitly requires a Railway deployment to pass without native compilation errors."
---

# Phase 02: DB Foundation Verification Report

**Phase Goal:** The city database is committed to the repo and the Railway build compiles better-sqlite3 natively without errors
**Verified:** 2026-05-12T09:12:52Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                                                             | Status      | Evidence                                                                                                                 |
|----|---------------------------------------------------------------------------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------|
| 1  | `data/cities.db` exists in the repository and is queryable at runtime                                                                            | VERIFIED | `git ls-files data/cities.db` returns the file; `node` query returns 7300 rows with full schema                       |
| 2  | `scripts/build-cities-db.mjs` runs cleanly and produces a valid SQLite file with correct schema                                                  | VERIFIED | File exists, is substantive, produces `cities` table with schema `["id","name","city_ascii","country","region","lat","lon","timezone","population"]` and 7300 rows |
| 3  | Railway deployment completes without `better-sqlite3` native compilation errors                                                                   | ? UNCERTAIN | All local mitigations are in place (dep in dependencies, serverExternalPackages set, native binary compiles) — but a live Railway build has not been observed |
| 4  | `next.config.ts` contains `serverExternalPackages: ['better-sqlite3']` and `outputFileTracingIncludes` so DB file survives `next build` tracing  | VERIFIED | Both keys present with correct values; deprecated `serverComponentsExternalPackages` absent                             |
| 5  | `src/lib/db.ts` exports `getDb()` with `global.__db` HMR-safe singleton                                                                          | VERIFIED | File exports only `getDb()` as a named function; `global.__db` used for caching; no `export default`                  |
| 6  | DB path uses `process.cwd()` not `__dirname`                                                                                                      | VERIFIED | `__dirname` appears only in a comment (explaining why it is NOT used); `process.cwd()` used in `DB_PATH` constant      |
| 7  | `fileMustExist: true` on `Database` constructor                                                                                                   | VERIFIED | `new Database(DB_PATH, { readonly: true, fileMustExist: true })` on line 27                                            |
| 8  | Row count logged to stdout on first open                                                                                                          | VERIFIED | `console.log(\`[db] cities.db opened: ${count} rows\`)` on line 31; confirmed by behavioral spot-check                 |

**Score:** 7/8 truths verified (1 uncertain — requires live Railway deployment)

---

## Required Artifacts

| Artifact                        | Expected                                                    | Status      | Details                                                                                      |
|---------------------------------|-------------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------|
| `package.json`                  | `better-sqlite3` in dependencies; `build-db` script        | VERIFIED | `"better-sqlite3": "^12.4.1"` in `dependencies`; `"build-db": "node scripts/build-cities-db.mjs"` in scripts; `@types/better-sqlite3` in devDependencies |
| `next.config.ts`                | `serverExternalPackages` + `outputFileTracingIncludes`      | VERIFIED | Both keys present; `serverComponentsExternalPackages` (deprecated) is absent; `outputFileTracingIncludes: { "/*": ["./data/cities.db"] }` |
| `data/worldcities.csv`          | Simplemaps Basic column format, 7000+ lines, git-tracked    | VERIFIED | 7301 lines (7300 data + 1 header); git-tracked; header contains `city_ascii`, `admin_name`, `population`, `lat`, `lng`, `id` |
| `scripts/build-cities-db.mjs`   | ESM script, idempotent, batch transaction, process.cwd()    | VERIFIED | Contains `import Database`, `process.cwd()`, `DROP TABLE IF EXISTS`, `db.transaction()`, `col('admin_name')`, `col('lng')`; no `CREATE INDEX` |
| `data/cities.db`                | SQLite binary, correct schema, 7000–7500 rows, git-tracked  | VERIFIED | 7300 rows; schema `["id","name","city_ascii","country","region","lat","lon","timezone","population"]`; git-tracked; queryable at runtime |
| `src/lib/db.ts`                 | `getDb()` named export, `global.__db`, `fileMustExist`      | VERIFIED | All required patterns present; no `__dirname` in code; no `export default`; `eslint-disable-next-line no-var` present |

---

## Key Link Verification

| From                              | To                                | Via                                                              | Status      | Details                                                                     |
|-----------------------------------|-----------------------------------|------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------|
| `next.config.ts`                  | `better-sqlite3` native binary    | `serverExternalPackages` prevents webpack bundling               | WIRED    | Key `serverExternalPackages: ["better-sqlite3"]` present; deprecated key absent |
| `next.config.ts`                  | `data/cities.db`                  | `outputFileTracingIncludes` ensures DB survives next build       | WIRED    | `outputFileTracingIncludes: { "/*": ["./data/cities.db"] }` present        |
| `scripts/build-cities-db.mjs`     | `data/worldcities.csv`            | `readFileSync(CSV_PATH)` where `CSV_PATH = join(process.cwd(), 'data', 'worldcities.csv')` | WIRED | `process.cwd()` path used; CSV_PATH maps correctly |
| `scripts/build-cities-db.mjs`     | `data/cities.db`                  | `new Database(DB_PATH)` where `DB_PATH = join(process.cwd(), 'data', 'cities.db')` | WIRED | DB_PATH uses `process.cwd()` |
| `src/lib/db.ts getDb()`           | `data/cities.db`                  | `path.join(process.cwd(), 'data', 'cities.db')`                 | WIRED    | `DB_PATH` constant on line 14; opened with `readonly: true, fileMustExist: true` |
| `src/lib/db.ts getDb()`           | `global.__db`                     | `if (!global.__db) { global.__db = new Database(...) }`         | WIRED    | Guard on line 26; singleton returned on line 33 |

---

## Data-Flow Trace (Level 4)

`src/lib/db.ts` is a singleton provider, not a rendering artifact. Data-flow trace is not applicable here — `getDb()` returns a live Database handle populated from the actual SQLite binary. The behavioral spot-check (below) confirms real data flows.

---

## Behavioral Spot-Checks

| Behavior                                       | Command                                                                                                                   | Result                                                                      | Status  |
|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|---------|
| DB opens with `fileMustExist` + `readonly`; 7300 rows returned | `node -e "... new D(dbPath, { readonly: true, fileMustExist: true }) ..."` | `[db] cities.db opened: 7300 rows` / Schema: `["id","name","city_ascii","country","region","lat","lon","timezone","population"]` | PASS |
| `build-cities-db.mjs` schema correctness (verified via DB query) | `node -e "... PRAGMA table_info(cities) ..."` | All 9 columns present in correct order; `rowCount: 7300`; `sampleTimezone: ""`  | PASS |
| Native binary compiled                         | `ls node_modules/better-sqlite3/build/Release/*.node`                                                                    | `better_sqlite3.node` present                                               | PASS |
| Railway cloud build passes without native errors | n/a — requires live Railway deployment                                                                                  | Cannot verify without deploying                                             | ? SKIP  |

---

## Requirements Coverage

| Requirement | Source Plan  | Description                                                                                                                          | Status      | Evidence                                                                                   |
|-------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------|
| CITY-01     | 02-01, 02-02, 02-03 | `data/cities.db` SQLite file (~7,300 world cities) committed to the repository and available at runtime on Railway          | VERIFIED | DB exists, git-tracked, queryable; `getDb()` singleton opens it correctly at `process.cwd()/data/cities.db` |
| CITY-02     | 02-01, 02-02 | `scripts/build-cities-db.mjs` converts Simplemaps Basic CSV to `cities.db` with schema `id, name, city_ascii, country, region, lat, lon, timezone, population` | VERIFIED | Build script verified; schema confirmed via PRAGMA; `worldcities.csv` committed and correctly parsed |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/db.ts` | 12–13 | `__dirname` appears in a comment | Info | Not a stub — comment explains WHY `__dirname` is NOT used; actual code path uses `process.cwd()` exclusively |

No blockers, no warnings. The `__dirname` in a comment is informational only and does not affect runtime behavior.

---

## Human Verification Required

### 1. Railway Native Compilation

**Test:** Trigger a Railway deployment of the current `main` branch (or push to the Railway-linked branch if different). Observe the build log in the Railway dashboard.

**Expected:**
- Build phase shows `better-sqlite3` native binary compiling successfully (NIXPACKS installs Node.js build tools and compiles the `.node` binary)
- No error of the form `Error: Cannot find module '...better_sqlite3.node'` or `node-pre-gyp` failure
- The `npm run start` phase begins and the Railway deployment log shows `[db] cities.db opened: 7300 rows` on first request (confirming DB file was included in the output bundle via `outputFileTracingIncludes`)

**Why human:** Cannot trigger or observe a Railway cloud build from this environment. All local mitigations are in place — `better-sqlite3` is in `dependencies` (not `devDependencies`), `serverExternalPackages` is correctly set, and the native binary compiles locally — but SC-3 explicitly requires a live Railway deployment to be confirmed as passing.

---

## Gaps Summary

No automated gaps found. All four ROADMAP success criteria are satisfied by codebase evidence except SC-3 (Railway native compilation), which requires a human to trigger a live deployment and observe the build log.

The codebase is in the correct state for SC-3 to pass: the two necessary conditions (package placement in `dependencies`, `serverExternalPackages` config) are both verified. The human check is a confirmation step, not a remediation step.

---

_Verified: 2026-05-12T09:12:52Z_
_Verifier: Claude (gsd-verifier)_
