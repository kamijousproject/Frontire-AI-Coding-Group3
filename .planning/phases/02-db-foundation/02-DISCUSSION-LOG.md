# Phase 02: DB Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 02-db-foundation
**Areas discussed:** SQLite indexes

---

## SQLite Indexes

| Option | Description | Selected |
|--------|-------------|----------|
| No index — table scan is fast enough | 7,300 rows is tiny. SQLite returns results in <1ms without any index. Simpler build script, no maintenance overhead. Research already confirmed this. | ✓ |
| Index on city_ascii | CREATE INDEX idx_city_ascii ON cities(city_ascii). Marginally faster queries, future-proof if the dataset grows. Minimal build script change. | |

**User's choice:** No index — table scan is fast enough
**Notes:** None. Decision aligned with research SUMMARY.md conclusion: "SQLite LIKE prefix + substring is sufficient for 7,300 cities."

---

## Gray Areas Not Discussed

The following areas were presented but not selected for discussion:

- **CSV source file** — Where build-cities-db.mjs expects the Simplemaps CSV. Deferred to Claude's discretion.
- **Railway validation** — How to confirm better-sqlite3 compiled correctly. Deferred to Claude's discretion.

## Claude's Discretion

- **CSV source file:** Planner decides the workflow (commit CSV at `data/worldcities.csv` vs. download-on-demand). Committing is preferred for developer convenience.
- **Railway validation approach:** Planner decides how to confirm compilation succeeded (startup row-count log recommended as low-overhead option).

## Deferred Ideas

- None — discussion stayed within Phase 02 scope.
