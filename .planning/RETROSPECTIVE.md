# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Weather Dashboard MVP

**Shipped:** 2026-05-12  
**Phases:** 1 | **Plans:** 3 | **Sessions:** ~5 (S14-S22)

### What Was Built

- Server-side Next.js API proxy for weatherapi.com — 4 endpoints with rate limiting, caching, input validation
- Complete React UI — SearchBar (debounced, duplicate detection), WeatherCard (bounded retry), WeatherGrid (responsive, dynamic bg)
- localStorage persistence hook with silent parse-error recovery
- Railway deployment configuration (NIXPACKS)
- 26/26 static UAT checks passed at ship

### What Worked

- **Sequential plan structure (01-01 → 01-02 → 01-03)** worked well — each plan had clean inputs from the prior one, zero integration friction
- **Static UAT format** caught the regex character class issue (T3) early and gave a clean 26/26 gate at ship
- **Direct-to-main branching** was the right call for a solo/small-team MVP — no PR overhead, fast iteration
- **Discriminated union types** (WeatherData `type:'data'` / WeatherError `type:'error'`) made component branching clean and type-safe

### What Was Inefficient

- Plans 01-02 and 01-03 were executed without writing SUMMARY.md — had to synthesize them retrospectively at milestone close (extra work)
- No REQUIREMENTS.md created during project setup (imported from SPEC.md but didn't generate the planning artifact) — meant skipping traceability table at close
- Manual browser tests M1-M8 still pending at ship — deployment and live API key setup are a human blocker

### Patterns Established

- **Plan → Execute → SUMMARY immediately** — don't defer summaries, they're needed for milestone close
- **Partial success model for batch endpoints** — always 200 with typed error entries, never fail the whole batch for one city
- **retryExhausted in page-level state, not hook** — keeps hooks data-only, UI concerns in components
- **TailwindCSS v4 CSS-first** — no tailwind.config.ts needed, auto content detection, use `@import "tailwindcss"` in globals.css

### Key Lessons

1. Write SUMMARY.md immediately after each plan completes — milestone close depends on them and retroactive synthesis is slower
2. Initialize REQUIREMENTS.md from the SPEC at import time, not just plans — gives a traceability table for milestone gate
3. Static UAT gates work well as a ship criterion when manual tests require external infrastructure (API keys, deployment)
4. In-memory caches and rate limiters are fine for Railway single-instance MVPs — document the constraint, don't over-engineer

### Cost Observations

- Model: claude-sonnet-4-6 throughout
- Sessions: ~5 (S14-S22 per memory)
- Notable: /gsd-import from SPEC.md was efficient — generated all 3 plan files in one shot with accurate task breakdowns

---

## Milestone: v1.1 — Local City Database + Instant Search

**Shipped:** 2026-05-13
**Phases:** 3 (02–04) | **Plans:** 8

### What Was Built

- better-sqlite3 city database (7,300 cities) — HMR-safe singleton, Railway-compatible native build
- `/api/cities/search` prefix-search endpoint with population ranking (LIMIT 8)
- Coordinate-based weather API — lat/lon replacing city name strings throughout
- localStorage v2 migration — `CityEntry[]` with silent v1 reset (no lat/lon recovery possible)
- Full ARIA combobox SearchBar — 200ms debounce, AbortController race cancellation, ↑↓ Enter Escape Tab, bold prefix via `<strong>`
- UAT: 4/4 passed. UI audit: 18/24.

### What Worked

- **Wave-based execution in Phase 03** — 4 plans in dependency order ran cleanly with no integration friction
- **AbortController-inside-setTimeout pattern** — discovered and documented correctly; prevents stale controllers that would govern wrong fetches
- **`onMouseDown` over `onClick` for suggestion selection** — correctly anticipates the blur/click ordering issue; found in research before implementation
- **UAT 4/4 clean pass** — all autocomplete behaviors worked as specified on first browser test
- **SUMMARY.md written immediately after each plan** — milestone close was smooth with no retroactive synthesis needed (lesson learned from v1.0)

### What Was Inefficient

- **UI audit gaps not caught during development** — loading indicator, `aria-label`, and `font-semibold` were all flagged by the post-hoc audit; could have been in the UI-SPEC checklist
- **Manual browser tests M1-M8 still deferred** — require live WEATHER_API_KEY; this block has now persisted across both milestones

### Patterns Established

- **AbortController inside setTimeout body** — not outside. Outside captures a stale controller reference for the wrong debounce window
- **`onMouseDown` + `e.preventDefault()` for dropdown items** — fires before `onBlur`; `onClick` fires after, which closes the dropdown before selection registers
- **Prefix highlight via String.slice + `<strong>`** — no `dangerouslySetInnerHTML`; split at `query.length`, wrap only the matched prefix
- **`process.cwd()` for DB path in App Router** — `__dirname` breaks in Next.js production builds; `process.cwd()` is stable

### Key Lessons

1. **UI-SPEC checklist should include loading states and aria-label** — these are generic enough to belong in every UI phase spec
2. **Grep-count acceptance criteria need camelCase awareness** — `highlightedIndex` (lowercase h) does NOT match `setHighlightedIndex` (capital H); the plan's grep assertions must account for JS naming conventions
3. **`better-sqlite3` on Railway**: nixpacks.toml override with python3/gcc/gnumake is the fallback if native compilation fails; document the JSON fallback path as a tier-2 option
4. Post-hoc UI audit (18/24) is useful — the 3 top findings are all fixable in < 1h and would have been caught if the UI-SPEC had a loading-state and accessibility checklist

### Cost Observations

- Model: claude-sonnet-4-6 throughout
- Sessions: 1 intensive day (2026-05-12 → 2026-05-13)
- Notable: Phase 04 (SearchBar rewrite) completed in ~12 minutes of execution time — the research phase caught all the tricky patterns (AbortController, onMouseDown) before implementation, so there was no rework

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 MVP | ~5 | 1 | 3 | First milestone — baseline established |
| v1.1 | ~1 day | 3 | 8 | SUMMARY.md discipline improved; research-before-implementation prevented all rework |

### Cumulative Quality

| Milestone | UAT | UI Audit | Ship Status |
|-----------|-----|----------|-------------|
| v1.0 | 26/26 static pass | — | Shipped — manual tests deferred |
| v1.1 | 4/4 browser pass | 18/24 | Shipped — M1-M8 and UI gaps deferred |

### Top Lessons (Verified Across Milestones)

1. Write SUMMARY.md immediately after plan execution — not retrospectively at close
2. Partial success models (always 200 with typed errors) are more resilient than all-or-nothing batch endpoints
3. Research-before-implementation prevents rework — AbortController and onMouseDown patterns caught in research, not at bug-fix time
4. UI-SPEC should include loading states and `aria-label` as standard checklist items — both were missed and caught only post-hoc
