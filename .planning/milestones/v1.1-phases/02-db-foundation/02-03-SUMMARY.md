---
phase: 02-db-foundation
plan: "03"
subsystem: database
tags: [better-sqlite3, sqlite, singleton, hmr, global, process-cwd, railway]

# Dependency graph
requires:
  - phase: 02-01
    provides: better-sqlite3 runtime dependency installed and Next.js configured with serverExternalPackages

provides:
  - src/lib/db.ts exporting getDb() — process-level better-sqlite3 singleton for all Phase 03+ callers
  - HMR-safe connection caching via global.__db — one Database handle per process lifetime
  - Fail-loud startup validation via fileMustExist — missing cities.db throws immediately
  - Row-count log on first open with [db] prefix for Railway deployment validation

affects:
  - 03-01 (cities search route — imports getDb() for SQLite queries)
  - 03-02 and beyond (any server route needing city data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - global.__db HMR-safe singleton pattern (declared via global type augmentation)
    - process.cwd() for DB path resolution in App Router (never __dirname)
    - fileMustExist + readonly Database options for fail-loud read-only SQLite

key-files:
  created:
    - src/lib/db.ts
  modified: []

key-decisions:
  - "global.__db used over module-level let — module-level state is reset on each HMR cycle in Next.js dev mode; global persists for the process lifetime"
  - "eslint-disable-next-line no-var required inside declare global block — TypeScript requires var in global augmentation even though project ESLint disallows it"
  - "Row-count log added on first open — provides zero-overhead Railway deployment validation visible in deployment logs"

patterns-established:
  - "SQLite singleton: use global.__db pattern with declare global type augmentation for HMR-safe process-level caching"
  - "Fail-loud DB init: { fileMustExist: true } on Database constructor catches misconfiguration immediately"
  - "App Router path resolution: always use process.cwd() for data file paths — never __dirname"

requirements-completed:
  - CITY-01

# Metrics
duration: 3min
completed: "2026-05-12"
---

# Phase 02 Plan 03: DB Singleton — src/lib/db.ts Summary

**Process-level better-sqlite3 singleton with global.__db HMR safety, fileMustExist fail-loud validation, and process.cwd() path resolution for Railway-compatible DB access**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T08:55:53Z
- **Completed:** 2026-05-12T08:59:36Z
- **Tasks:** 1
- **Files modified:** 1 (src/lib/db.ts created)

## Accomplishments

- Created src/lib/db.ts following all src/lib/ module conventions (block doc-comment, named exports only, no default export)
- Implemented getDb() with global.__db caching — one Database handle per process, survives Next.js HMR cycles in development
- Opened with { readonly: true, fileMustExist: true } — write attempts throw immediately, missing DB throws loudly at first getDb() call
- Row-count log on first open: `[db] cities.db opened: N rows` — visible in Railway deployment logs for zero-cost startup validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/lib/db.ts — better-sqlite3 HMR-safe singleton** - `e974c6c` (feat)

## Files Created/Modified

- `src/lib/db.ts` — Process-level better-sqlite3 singleton; exports getDb(); uses global.__db for HMR safety; opens with readonly + fileMustExist; logs row count with [db] prefix on first open

## Decisions Made

- **global.__db over module-level let:** In Next.js development mode, each HMR cycle re-evaluates the module, resetting module-level state. A module-level `let db: Database` would open a new connection on every file save. The global object persists for the entire process lifetime, ensuring exactly one Database handle regardless of how many times the module is re-evaluated.
- **eslint-disable-next-line no-var:** TypeScript's `declare global { }` block requires `var` for global variable declarations — even in projects with ESLint rules prohibiting `var`. The disable comment is mandatory; without it, ESLint would fail the build.
- **Row-count log:** Added per the plan's "Claude's Discretion" note — a one-liner `console.log` on first open provides Railway deployment confirmation with zero performance overhead (runs once per process).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install required to make @types/better-sqlite3 available**
- **Found during:** Task 1 (TypeScript compilation verification)
- **Issue:** `@types/better-sqlite3` was listed in package.json devDependencies but not installed in node_modules — `npx tsc --noEmit` failed with "Cannot find module 'better-sqlite3' or its corresponding type declarations"
- **Fix:** Ran `npm install` from project root to sync node_modules with package.json
- **Files modified:** None (node_modules only, already declared in package.json)
- **Verification:** npx tsc --noEmit exits 0 after install
- **Committed in:** Not committed separately — node_modules is gitignored; package.json was already correct from Plan 01

---

**Total deviations:** 1 auto-fixed (1 blocking — missing installed dependency)
**Impact on plan:** Fix was a local environment sync (npm install), not a code change. No scope creep. package.json was already correct.

## Issues Encountered

- TypeScript compilation failed on first attempt because `@types/better-sqlite3` had not been installed in the local node_modules despite being declared in devDependencies. Running `npm install` resolved it. This was an environment state issue, not a code problem.

## Threat Surface Scan

No new network endpoints, auth paths, or external interfaces introduced. The file is purely a server-side singleton.

All threat model entries mitigated:

| Threat ID | Status |
|-----------|--------|
| T-02-08 (HMR connection leak) | Mitigated — global.__db creates exactly one Database handle per process |
| T-02-09 (write via read-only handle) | Mitigated — { readonly: true } causes immediate SQLite error on any write attempt |
| T-02-10 (wrong DB path via __dirname) | Mitigated — acceptance criterion enforced; file contains zero __dirname references in code |
| T-02-11 (SQL injection via Phase 03 query) | Transferred to Phase 03 — documented expectation to use db.prepare() with positional parameters |

## Known Stubs

None — getDb() is fully implemented. No placeholder data, no hardcoded returns, no TODO/FIXME markers.

## Next Phase Readiness

- src/lib/db.ts is ready for Phase 03 callers — import { getDb } from '@/lib/db' will work once cities.db is present at data/cities.db
- Phase 02 Plan 02 (cities.db builder script) must run before any route can call getDb() in development
- TypeScript compilation passes with no errors — Phase 03 planning can proceed immediately

---
*Phase: 02-db-foundation*
*Completed: 2026-05-12*
