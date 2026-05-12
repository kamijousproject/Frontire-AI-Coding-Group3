---
phase: 02-db-foundation
plan: "01"
subsystem: database
tags: [better-sqlite3, sqlite, next.config, native-binary, railway, nixpacks]

# Dependency graph
requires: []
provides:
  - better-sqlite3 runtime dependency installed and native binary compiled
  - build-db npm script entry for running the cities DB builder
  - serverExternalPackages config preventing webpack bundling of native .node binary
  - outputFileTracingIncludes config ensuring cities.db survives Next.js build tracing for Railway
affects:
  - 02-02 (cities.db builder script — uses build-db script and better-sqlite3)
  - 02-03 (SQLite city search API — requires both package and config to be in place)
  - 03-01 (search endpoint wiring — depends on DB foundation)

# Tech tracking
tech-stack:
  added:
    - better-sqlite3@^12.4.1 (runtime dep — native binary)
    - "@types/better-sqlite3@latest (devDep — TypeScript types)"
  patterns:
    - Native node modules excluded from webpack via serverExternalPackages
    - Railway output tracing inclusion for non-public data files

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - next.config.ts

key-decisions:
  - "better-sqlite3 placed in dependencies (not devDependencies) so Railway NIXPACKS compiles the native binary during production build"
  - "serverExternalPackages key used (not serverComponentsExternalPackages) — correct for Next.js 15+"
  - "outputFileTracingIncludes with key '/*' ensures cities.db at data/cities.db is copied into the Next.js output bundle"

patterns-established:
  - "Native addon isolation: use serverExternalPackages to keep native .node binaries out of webpack bundle"
  - "Railway DB file tracing: outputFileTracingIncludes ensures bundled binary data files survive next build"

requirements-completed:
  - CITY-01
  - CITY-02

# Metrics
duration: 2min
completed: "2026-05-12"
---

# Phase 02 Plan 01: DB Foundation — better-sqlite3 Install and Next.js Config Summary

**better-sqlite3 installed as a runtime dependency with native binary compiled, and Next.js configured to exclude it from webpack bundling and include cities.db in Railway output tracing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-12T03:56:39Z
- **Completed:** 2026-05-12T03:58:08Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, package-lock.json, next.config.ts)

## Accomplishments

- Added better-sqlite3@^12.4.1 to dependencies and @types/better-sqlite3@latest to devDependencies; native binary compiled successfully via npm install
- Added build-db npm script entry (node scripts/build-cities-db.mjs) to package.json
- Configured next.config.ts with serverExternalPackages to prevent webpack from bundling the native .node binary
- Configured next.config.ts with outputFileTracingIncludes to ensure data/cities.db survives next build output tracing for Railway deployment

## Task Commits

Each task was committed atomically:

1. **Task 1: Add better-sqlite3 dependency and build-db npm script** - `aa8bdf7` (feat)
2. **Task 2: Add serverExternalPackages and outputFileTracingIncludes to next.config.ts** - `669701d` (feat)

## Files Created/Modified

- `package.json` — Added better-sqlite3 runtime dep, @types/better-sqlite3 devDep, build-db script
- `package-lock.json` — Updated with better-sqlite3 and its dependency tree (403 packages total)
- `next.config.ts` — Added serverExternalPackages and outputFileTracingIncludes; TypeScript noEmit passes

## Decisions Made

- **better-sqlite3 in dependencies (not devDependencies):** Railway NIXPACKS runs `npm install --production` by default; placing the package in devDependencies would skip native binary compilation and cause a runtime crash with no error at build time.
- **serverExternalPackages (not serverComponentsExternalPackages):** The old key name was deprecated at Next.js 15.0.0 and silently does nothing in Next.js 15+. The plan explicitly calls this out; the new key was verified against installed Next.js version.
- **outputFileTracingIncludes with key `/*`:** Applies to all routes, ensuring the DB file is copied regardless of which routes import the SQLite module.

## Deviations from Plan

None — plan executed exactly as written.

One note: the plan's acceptance criteria for Task 2 states "file must NOT contain serverComponentsExternalPackages". The initial comment draft included it as a negative example ("NOT serverComponentsExternalPackages"), which would have made the grep check report a false positive. The comment was reworded to remove the old key name entirely, keeping it clean and unambiguous.

## Issues Encountered

None — npm install completed cleanly, native binary compiled on first attempt, and TypeScript compilation passed with both new config keys.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Both changes are build-time configuration. Threats T-02-01 and T-02-03 from the plan's threat model are fully mitigated:

- T-02-01 (misconfiguration of serverExternalPackages): Mitigated — correct key used, TypeScript noEmit validates shape.
- T-02-03 (better-sqlite3 in devDependencies skipped on Railway): Mitigated — package is in "dependencies".

## Known Stubs

None — this plan is purely dependency installation and build configuration. No UI components or data-rendering code was created.

## Next Phase Readiness

- better-sqlite3 is installed and the native binary compiled locally — Phase 02 Plan 02 (cities.db builder script) can proceed immediately
- next.config.ts is configured correctly — when the DB file is built at data/cities.db, it will be included in Railway deploys automatically
- No blockers

---
*Phase: 02-db-foundation*
*Completed: 2026-05-12*
