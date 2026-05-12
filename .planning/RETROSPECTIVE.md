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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 MVP | ~5 | 1 | 3 | First milestone — baseline established |

### Cumulative Quality

| Milestone | Static Checks | Manual Tests | Ship Status |
|-----------|---------------|--------------|-------------|
| v1.0 | 26/26 pass | 8 pending | Shipped — manual tests deferred |

### Top Lessons (Verified Across Milestones)

1. Write SUMMARY.md immediately after plan execution — not retrospectively at close
2. Partial success models (always 200 with typed errors) are more resilient than all-or-nothing batch endpoints
