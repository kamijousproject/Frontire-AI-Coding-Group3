# PROJECT: Frontier AI — Weather Dashboard

## What This Is

A server-side weather dashboard built with Next.js 16 that lets users search and track weather for multiple cities simultaneously. Cities persist across page reloads via localStorage. Weather data is fetched through a secure server-side API proxy that caches responses, enforces rate limiting, and never exposes the API key to the client.

## Core Value

Real-time weather at a glance — multiple cities, one page, no page refresh needed.

## Tech Stack

- **Frontend:** Next.js 16.2.6 (App Router), React 19, TypeScript 5, TailwindCSS v4
- **Backend:** Next.js API Routes (server-side proxy to weatherapi.com)
- **Deployment:** Railway (NIXPACKS builder)
- **API:** weatherapi.com (current weather + city search)

## Current Milestone: v1.2 Forecast, AQI, Auto-location & UI Polish

**Goal:** Enrich each city card with 5-day forecast and air quality data, detect the user's location on first load, and close 3 UI audit gaps from v1.1.

**Target features:**
- 5-day forecast on each weather card (backend route exists at `/api/v1/weather/forecast`)
- Air quality index (AQI) on weather cards (`aqi=yes` param, new AQI fields in WeatherData type)
- IP-based auto-location on first load (`/api/v1/weather/location` route exists, needs UI hook)
- Loading indicator in SearchBar during 200ms debounce fetch
- `aria-label="Search for a city"` on SearchBar input
- `font-semibold` → `font-bold` in WeatherCard (typography spec fix)

## Requirements

### Validated (v1.0)

- ✓ Multi-city weather dashboard (up to 10 cities) — v1.0
- ✓ Server-side API proxy with weatherapi.com — v1.0
- ✓ API key never exposed to client bundle — v1.0
- ✓ 10-minute server-side response cache — v1.0
- ✓ Per-IP rate limiting — v1.0
- ✓ localStorage city list persistence (survives reload) — v1.0
- ✓ Responsive grid layout (1/2/3-col at mobile/tablet/desktop) — v1.0
- ✓ Dynamic page background by weather condition + day/night — v1.0
- ✓ Duplicate city detection with inline error — v1.0
- ✓ Bounded retry (1 retry per city, permanent fail state after) — v1.0
- ✓ Railway deployment configuration — v1.0

### Validated (v1.1)

- ✓ SQLite city database (7,300 cities) bundled in repo — Phase 02
- ✓ better-sqlite3 HMR-safe singleton (`getDb()`) — Phase 02
- ✓ `/api/cities/search` server-side endpoint with SQLite queries — Phase 03
- ✓ Weather lookup via lat/lon instead of city name string — Phase 03
- ✓ localStorage schema migrated to CityEntry[] (weather_cities_v2) — Phase 03
- ✓ Type-ahead SearchBar with instant local suggestions (2+ chars, 200ms debounce, AbortController) — Phase 04
- ✓ Dropdown: up to 8 results, City/Region/Country format, keyboard nav (↑↓ Enter Escape Tab) — Phase 04
- ✓ Match highlighting — typed characters bold in suggestion rows — Phase 04

### Active (v1.2)

- [ ] 5-day forecast panel on each weather card
- [ ] Air quality index (AQI) displayed on weather cards
- [ ] IP-based auto-location on first load (add first city automatically)
- [ ] Loading indicator in SearchBar during debounce fetch
- [ ] `aria-label="Search for a city"` on SearchBar input
- [ ] `font-bold` instead of `font-semibold` in WeatherCard
- [ ] Manual browser tests M1-M8 against live Railway deployment
- [ ] Production deployment with real WEATHER_API_KEY

### Out of Scope

- Mobile native app — web-first approach, responsive design sufficient
- WebSocket real-time updates — polling on demand acceptable for MVP
- User accounts — localStorage-only for v1.0 scope

## Context

Shipped v1.1 with ~1,214 LOC TypeScript across src/ (incremental over v1.0 base).  
Tech: Next.js 16 App Router, TailwindCSS v4, better-sqlite3, weatherapi.com (lat/lon).  
City database: 7,300 cities in `data/cities.db`. localStorage schema: `CityEntry[]` (weather_cities_v2).  
UAT: 4/4 manual browser tests passed. UI audit: 18/24 (top gaps: loading indicator, aria-label, font weight).

## Key Decisions

| Decision | Version | Outcome |
|----------|---------|---------|
| TailwindCSS v4 CSS-first (no tailwind.config.ts) | v1.0 | ✓ Good |
| Next.js 16 + React 19 (latest scaffolded) | v1.0 | ✓ Good |
| Partial success model for /multiple (always 200) | v1.0 | ✓ Good |
| In-memory rate limit store (resets on restart) | v1.0 | — Acceptable single-instance |
| CITY_PATTERN hyphen at end of char class | v1.0 | ✓ Good (fixed regex error) |
| fetchCurrentWeather() directly in /multiple | v1.0 | ✓ Good (avoids double rate-limit) |
| AbortController created inside setTimeout callback | v1.1 | ✓ Critical — prevents stale controller from prior keypress governing a later fetch |
| onMouseDown (not onClick) for suggestion selection | v1.1 | ✓ Good — fires before onBlur so dropdown stays open until selection registered |
| Prefix highlight via String.slice + `<strong>`, no dangerouslySetInnerHTML | v1.1 | ✓ Safe — XSS-free, zero innerHTML |
| 200ms debounce (corrected from 300ms) | v1.1 | ✓ Good — matches AUTO-01 spec; 300ms was a pre-existing correctness bug |

## Constraints

- `WEATHER_API_KEY` must be set as a Railway environment variable (never NEXT_PUBLIC_)
- Single Railway instance — in-memory cache and rate limit state acceptable
- weatherapi.com free tier limits apply

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 — v1.2 milestone started*
