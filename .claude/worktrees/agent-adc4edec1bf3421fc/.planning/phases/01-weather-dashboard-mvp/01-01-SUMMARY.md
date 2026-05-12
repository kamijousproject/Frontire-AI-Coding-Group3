---
phase: "01-weather-dashboard-mvp"
plan: "01-01"
subsystem: "foundation"
tags: ["nextjs", "typescript", "tailwind", "weatherapi", "cache", "rate-limit", "validation"]
dependency_graph:
  requires: []
  provides:
    - "src/types/weather.ts — all shared interfaces"
    - "src/lib/cache.ts — get/set WeatherData with 10-min TTL"
    - "src/lib/rate-limit.ts — checkRateLimit(request)"
    - "src/lib/validation.ts — validateCityParam/validateCitiesParam/validateCoordParam"
    - "src/lib/weatherapi.ts — fetchCurrentWeather/fetchCitySearch"
  affects: []
tech_stack:
  added:
    - "Next.js 16.2.6 (App Router, Turbopack)"
    - "React 19.2.4"
    - "TypeScript 5"
    - "TailwindCSS v4 (CSS-first config via @import tailwindcss)"
    - "next/font/google Inter"
  patterns:
    - "Module-level Map store for in-memory cache and rate-limit state"
    - "AbortController with setTimeout for fetch timeouts"
    - "Discriminated union types (WeatherData | WeatherError) via 'type' field"
key_files:
  created:
    - "src/types/weather.ts"
    - "src/lib/cache.ts"
    - "src/lib/rate-limit.ts"
    - "src/lib/validation.ts"
    - "src/lib/weatherapi.ts"
    - ".env.example"
  modified:
    - "src/app/layout.tsx"
    - "src/app/globals.css"
    - ".gitignore"
    - "package.json"
decisions:
  - "Used Next.js 16.2.6 with React 19 as scaffolded by create-next-app (latest stable)"
  - "TailwindCSS v4 CSS-first config (no tailwind.config.ts needed — auto content detection)"
  - "Hyphen placed at end of CITY_PATTERN character class to avoid TypeScript regex range error"
  - "fetchCitySearch silently returns [] on timeout/error (non-fatal for search UX)"
metrics:
  duration: "16 minutes"
  completed_date: "2026-05-08"
  tasks_completed: 6
  tasks_total: 6
  files_created: 7
  files_modified: 4
---

# Phase 01 Plan 01: Foundation — Types, Libs, Infra Summary

Next.js 16 project scaffolded with all shared foundation libraries: discriminated-union TypeScript interfaces, 10-minute server-side cache, per-IP rate limiter using last X-Forwarded-For value, city name input validator, and weatherapi.com client with 5-second AbortController timeout and https icon normalization.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| T1 | Project Scaffolding | 6f5a537 | package.json, tsconfig.json, layout.tsx, .env.example |
| T2 | TypeScript Interfaces | cae3495 | src/types/weather.ts |
| T3 | Input Validation Library | b66982b | src/lib/validation.ts |
| T4 | Rate Limiting Middleware | f23ab39 | src/lib/rate-limit.ts |
| T5 | Server-Side Cache | 558e849 | src/lib/cache.ts |
| T6 | weatherapi.com Client | a8950fe | src/lib/weatherapi.ts |

## Verification Results

All must_haves truths confirmed:
- `src/types/weather.ts` exports WeatherData (type: 'data') and WeatherError (type: 'error') discriminants
- `src/lib/weatherapi.ts` reads API key from `process.env.WEATHER_API_KEY` only — no NEXT_PUBLIC_
- All icon_url values normalized via `normalizeIconUrl`: `//cdn...` → `https://cdn...`
- Cache key is `city.toLowerCase().trim()` with TTL_MS = 600_000
- Rate limiter uses `forwarded.split(',').pop()?.trim()` for last X-Forwarded-For value
- Input validation uses CITY_PATTERN = `/^[a-zA-Z0-9 ,'.\\-]+$/`
- `npm run build` exits 0 across all tasks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed regex character class range error in CITY_PATTERN**
- **Found during:** Task T3 — TypeScript build failed
- **Issue:** Plan specified `CITY_PATTERN = /^[a-zA-Z0-9 ,'\\-\\.]+$/` where `\\-` before `\\.` created an ambiguous range `\-\.` causing "Range out of order in character class" error
- **Fix:** Moved hyphen to end of character class: `/^[a-zA-Z0-9 ,'.\\-]+$/`
- **Files modified:** src/lib/validation.ts
- **Commit:** b66982b

### Structural Notes (non-bugs)

**Tailwind v4 CSS-first configuration:** The plan references `tailwind.config.ts` with a content array. TailwindCSS v4 (scaffolded by create-next-app latest) uses CSS-first configuration — no `tailwind.config.ts` file exists. Tailwind v4 auto-detects content from project files. The `@import "tailwindcss"` directive in `globals.css` is the v4 equivalent. No behavior change to the project.

**Next.js 16 with React 19:** create-next-app scaffolded Next.js 16.2.6 (not 14+). The app router, TypeScript, and TailwindCSS integration work identically. No action needed.

## Known Stubs

None. This plan creates infrastructure libraries only — no UI rendering or data display. All exports are fully implemented.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: api-key-env | src/lib/weatherapi.ts | WEATHER_API_KEY read from process.env — must never be set as NEXT_PUBLIC_ or exposed to client bundle |
| threat_flag: rate-limit-memory | src/lib/rate-limit.ts | In-memory rate limit store resets on process restart; single-instance Railway deployment acceptable per SPEC |

## Self-Check: PASSED

Files verified:
- src/types/weather.ts — FOUND
- src/lib/cache.ts — FOUND
- src/lib/rate-limit.ts — FOUND
- src/lib/validation.ts — FOUND
- src/lib/weatherapi.ts — FOUND
- .env.example — FOUND

Commits verified in git log:
- 6f5a537 — FOUND (T1)
- cae3495 — FOUND (T2)
- b66982b — FOUND (T3)
- f23ab39 — FOUND (T4)
- 558e849 — FOUND (T5)
- a8950fe — FOUND (T6)
