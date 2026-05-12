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

## Current Milestone: v1.1 Local City Database + Instant Search

**Goal:** Replace live weatherapi.com city search with a bundled SQLite database of ~5,000 major world cities, enabling instant type-ahead autocomplete and more precise weather lookups via lat/lon.

**Target features:**
- `cities.db` bundled in repo (city, country, region, lat, lon, timezone, population)
- Server-side `/api/cities/search` endpoint querying SQLite
- SearchBar upgraded to instant type-ahead (local results, no API call per keystroke)
- Weather fetched by lat/lon coordinates instead of city name string
- Same add-to-dashboard flow preserved

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

### Active (v1.1)

- [ ] SQLite city database (~5,000 major cities) bundled in repo
- [ ] `/api/cities/search` server-side endpoint with SQLite queries
- [ ] Type-ahead SearchBar with instant local suggestions
- [ ] Weather lookup via lat/lon instead of city name string
- [ ] Manual browser tests M1-M8 against live Railway deployment
- [ ] Production deployment with real WEATHER_API_KEY

### Out of Scope

- Mobile native app — web-first approach, responsive design sufficient
- WebSocket real-time updates — polling on demand acceptable for MVP
- User accounts — localStorage-only for v1.0 scope

## Context

Shipped v1.0 with ~3,661 LOC across 36 files (TypeScript, TSX, CSS, JSON).  
Tech: Next.js 16 App Router, TailwindCSS v4 CSS-first config, weatherapi.com.  
Static audit: 26/26 must_have truths pass. Manual M1-M8 tests pending live deployment.

## Key Decisions

| Decision | Version | Outcome |
|----------|---------|---------|
| TailwindCSS v4 CSS-first (no tailwind.config.ts) | v1.0 | ✓ Good |
| Next.js 16 + React 19 (latest scaffolded) | v1.0 | ✓ Good |
| Partial success model for /multiple (always 200) | v1.0 | ✓ Good |
| In-memory rate limit store (resets on restart) | v1.0 | — Acceptable single-instance |
| CITY_PATTERN hyphen at end of char class | v1.0 | ✓ Good (fixed regex error) |
| fetchCurrentWeather() directly in /multiple | v1.0 | ✓ Good (avoids double rate-limit) |

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
*Last updated: 2026-05-12 — v1.1 milestone started*
