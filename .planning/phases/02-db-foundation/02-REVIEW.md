---
phase: 02-db-foundation
reviewed: 2026-05-12T09:10:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - next.config.ts
  - package.json
  - scripts/build-cities-db.mjs
  - src/lib/db.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-12T09:10:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 02 introduces `better-sqlite3` as a native dependency, a one-shot CSV-to-SQLite build script, and an HMR-safe database singleton. The overall design is sound: the global-singleton pattern for HMR safety is correct, the config keys are valid for Next.js 16, and the CSV parser handles the common case correctly.

However, there is one critical correctness bug in the schema that causes silently wrong data for a meaningful subset of rows, four warnings covering silent data corruption, a missing search index, an unvalidated `parseInt` path, and a redundant `serverExternalPackages` entry. Two minor info items round out the report.

---

## Critical Issues

### CR-01: `region` Column Declared `NOT NULL` But 6 Rows Have Empty `admin_name`

**File:** `scripts/build-cities-db.mjs:30`
**Issue:** The `CREATE TABLE` DDL declares `region TEXT NOT NULL`, but the CSV contains 6 rows (Hong Kong, Singapore, Nouakchott, Chongming, Laayoune, Willemstad) where `admin_name` is the empty string `""`. The build script maps `admin_name` to `region` and falls back to `''` when the field is missing (`fields[col('admin_name')] || ''`). Inserting an empty string into a `NOT NULL TEXT` column is allowed by SQLite (it stores `""`), so the build does not fail — but the schema constraint is semantically incorrect and downstream queries that filter `WHERE region != ''` or treat empty strings as `NULL` will silently omit real cities. More dangerously, if the schema is ever migrated or re-exported to a stricter engine, these rows will break at that boundary with no prior warning.

**Fix:** Either change the column to `region TEXT NOT NULL DEFAULT ''` (already structurally what happens) and document that empty string means "no administrative region", or change the fallback and column to use `NULL`:

```sql
-- Option A: allow NULL (semantically cleaner)
region TEXT,

-- Option B: keep NOT NULL but make the empty-string intent explicit
region TEXT NOT NULL DEFAULT '',
```

And in the insert logic, use `null` instead of `''` for Option A:
```js
const region = fields[col('admin_name')] || null
```

---

## Warnings

### WR-01: `parseInt(fields[col('id')], 10)` Is Not Validated Before Being Used as the Primary Key Guard

**File:** `scripts/build-cities-db.mjs:67,77`
**Issue:** `parseInt` returns `NaN` when the input is not a valid integer. The guard on line 77 is `if (!id || !name) continue` — `!NaN` is `true`, so rows with a non-numeric `id` are correctly skipped. However, `parseInt("0", 10)` returns `0`, and `!0` is also `true`, which means a row with a legitimate `id` of `0` would be silently dropped. More subtly, `parseInt` with a leading non-numeric string such as `" 1abc"` returns `NaN` (correct) but `parseInt("1abc", 10)` returns `1` (silent corruption). The CSV header `id` field from the actual data is well-formed, but this is a latent correctness risk if the source CSV ever changes.

**Fix:** Use an explicit `isNaN` check and a stricter parse guard:
```js
const id = parseInt(fields[col('id')], 10)
if (isNaN(id) || !name) continue
```

### WR-02: Missing Index on `cities.name` / `city_ascii` — All Searches Will Be Full-Table Scans

**File:** `scripts/build-cities-db.mjs:21-34`
**Issue:** The `CREATE TABLE` statement creates no indexes. The intended use of this database is autocomplete/search (the cities search API route exists). Without an index, every `LIKE 'query%'` or `WHERE city_ascii = ?` query performs a full scan of 7,300 rows. While 7,300 rows is small enough that this will not produce visible latency today, there is no index at all — not even on `name` or `city_ascii`. If a `LIKE '%query%'` (infix) search pattern is used (common for autocomplete), SQLite cannot use a B-tree index anyway, but a prefix search `LIKE 'query%'` is indexable and the schema gives it no opportunity.

**Fix:** Add at minimum a case-insensitive index on the ASCII name column after the `CREATE TABLE`:
```sql
CREATE INDEX IF NOT EXISTS idx_cities_city_ascii ON cities (city_ascii COLLATE NOCASE);
```

### WR-03: `@types/better-sqlite3` Pinned to `latest` — Non-Deterministic Builds

**File:** `package.json:20`
**Issue:** `"@types/better-sqlite3": "latest"` is the only dependency in the entire file not pinned to a semver range. `latest` resolves at install time to whatever the current published version is; if the types package publishes a breaking change (e.g., changes the `Database` constructor overload), CI and local builds will silently diverge. Every other `@types/*` package in this file uses a caret range (`^`), which at least pins the major version.

**Fix:** Replace `latest` with a pinned caret range matching the installed version:
```json
"@types/better-sqlite3": "^7.6.0"
```
(Run `npm ls @types/better-sqlite3` to confirm the currently installed version.)

### WR-04: `serverExternalPackages: ["better-sqlite3"]` Is Redundant — Package Is Already on the Built-In Allowlist

**File:** `next.config.ts:6`
**Issue:** Per the `serverExternalPackages` documentation bundled with this version of Next.js, `better-sqlite3` is already included in the built-in auto-opt-out list. The explicit entry in `next.config.ts` is therefore inert but misleading — it suggests the entry is load-bearing when it is not, and future maintainers may hesitate to remove it, creating drift. There is no correctness risk, but the comment ("Use serverExternalPackages (Next.js 15+)") also slightly misdirects: the key was renamed at 15.0.0 and the code is on 16.x, making the migration note stale.

**Fix:** Either remove the entry entirely and rely on the built-in list:
```ts
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./data/cities.db"],
  },
};
```
Or retain it with an accurate comment:
```ts
// better-sqlite3 is already on Next.js's built-in external-packages list.
// Listed explicitly here as documentation that this native module must not be bundled.
serverExternalPackages: ["better-sqlite3"],
```

---

## Info

### IN-01: `console.log` Left in Production Code Path (`src/lib/db.ts:31`)

**File:** `src/lib/db.ts:31`
**Issue:** `console.log(\`[db] cities.db opened: ${count} rows\`)` fires on every cold start of the Next.js server process, including in production. The row-count query (`SELECT COUNT(*) as n FROM cities`) is executed unconditionally on every first-call to `getDb()`, adding one extra SQLite statement to the startup path purely to emit a log line. In production this log is noise; in serverless/edge environments logs are often billed.

**Fix:** Guard behind a development check, or remove the count query and use a simpler marker:
```ts
if (process.env.NODE_ENV !== 'production') {
  const count = (global.__db.prepare('SELECT COUNT(*) as n FROM cities').get() as { n: number }).n;
  console.log(`[db] cities.db opened: ${count} rows`);
}
```

### IN-02: CSV Custom Parser Silently Strips Quote Characters From Field Values

**File:** `scripts/build-cities-db.mjs:54-64`
**Issue:** The hand-rolled CSV parser toggles `inQuote` on every `"` character but never appends the quote character to `current`. This correctly strips the surrounding delimiter quotes, but it also silently strips any quote character embedded within a field value. RFC 4180 uses `""` (doubled quote) to represent a literal `"` inside a quoted field; this parser converts `""` into an empty string instead of a single `"`. The actual worldcities.csv data does not contain any `""` escaped literals (verified against the bundled file), so this is not a current data-corruption risk — but the parser is incorrect by the CSV spec and will silently mangle data if the source file is ever replaced with one that uses RFC 4180 escaping.

**Fix:** Use Node's built-in `node:readline` + a spec-compliant CSV parser, or handle the RFC 4180 escape:
```js
if (ch === '"') {
  // RFC 4180: doubled quote inside a quoted field = literal quote character
  if (inQuote && line[ci + 1] === '"') {
    current += '"';
    ci++; // skip the second quote
  } else {
    inQuote = !inQuote;
  }
}
```

---

_Reviewed: 2026-05-12T09:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
