---
phase: 02
slug: db-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — validation by inspection + smoke commands |
| **Config file** | none — Wave 0 creates the deliverables (build script, DB file) |
| **Quick run command** | `npm run build-db` (verify row count in output) |
| **Full suite command** | `npm run build-db && node -e "const D=require('better-sqlite3'); const db=new D('./data/cities.db'); console.log(db.prepare('SELECT COUNT(*) as n FROM cities').get())"` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build-db` and verify row count log shows ~7,300 cities
- **After every plan wave:** Verify `data/cities.db` is tracked in git (`git ls-files data/cities.db`)
- **Before `/gsd-verify-work`:** Full Railway deployment must succeed without `node-gyp` errors
- **Max feedback latency:** ~5 seconds (build script runtime)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | CITY-01, CITY-02 | T-02-03 | better-sqlite3 in dependencies (not devDeps) | smoke | `node -e "const p=require('./package.json'); console.log(p.dependencies['better-sqlite3'], p.scripts['build-db'])"` | ❌ pending | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | CITY-01 | T-02-01 | serverExternalPackages not bundled by webpack | smoke | `npx tsc --noEmit` | ❌ pending | ⬜ pending |
| 02-02-T1 | 02-02 | 2 | CITY-02 | — | N/A | smoke | `npm run build-db` → log shows `~7300 cities inserted` | ❌ Wave 0 (script itself) | ⬜ pending |
| 02-02-T2 | 02-02 | 2 | CITY-01 | — | N/A | smoke | `git ls-files data/cities.db` → exits 0 | ❌ pending | ⬜ pending |
| 02-03-T1 | 02-03 | 2 | CITY-01 | — | readonly, fileMustExist guards DB access | smoke | `node -e "const {getDb}=require('./src/lib/db.ts')"` (TypeScript — verify via tsc instead) | ❌ pending | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/build-cities-db.mjs` — created as part of CITY-02; covers the build script task
- [ ] `data/worldcities.csv` — must be present before running build script (either committed or download documented)
- [ ] `better-sqlite3` installed — prerequisite for build script to run

*Framework install: N/A — no test framework required for this phase's deliverables.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Railway deploys without `node-gyp` errors | CITY-01 (runtime availability) | Requires actual Railway deployment | Deploy to Railway; check build log for `gyp ERR!` or `node-pre-gyp` failures. If none: pass. |
| `data/cities.db` is queryable at runtime | CITY-01 | Requires Railway deployment + API caller (Phase 03) | After Phase 03 deploys, confirm `/api/v1/cities/search?q=bang` returns results |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
