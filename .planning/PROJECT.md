# Weather Dashboard

## What This Is

A hobby web application that lets users search for cities and view real-time weather data for multiple cities simultaneously. Built with Next.js and deployed on Railway, it proxies requests to weatherapi.com so the API key never reaches the browser.

## Core Value

A user can search any city by name and immediately see current weather — clean, accurate, and live.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can search for a city by name and see autocomplete/matching results
- [ ] User can view current weather conditions for a selected city (temperature, humidity, wind speed, condition)
- [ ] User can view weather for multiple cities simultaneously (at least 3 at once)
- [ ] User can view a 5-day forecast for any city in the dashboard
- [ ] User can allow geolocation to auto-add their current city on load
- [ ] Dashboard is fully responsive — works on mobile, tablet, and desktop
- [ ] User sees meaningful states for loading, empty, not found, and network errors
- [ ] App is deployed and live on Railway with real weatherapi.com data

### Out of Scope

- User accounts / login / auth — out of scope v1, adds complexity without value for hobby use
- Historical weather analytics — not supported by weatherapi.com free tier meaningfully
- Weather map layers — visual complexity not worth it for this scope
- Social sharing — no user accounts to share from
- Multi-provider weather comparison — single source (weatherapi.com) is sufficient
- Paid subscription or monetization — hobby project

## Context

- **Existing planning docs**: SPEC.md, rule.md, skill.md, Weather-Dashboard-UI-SPEC.md already exist — roadmap should align with them
- **UI spec**: Detailed design contract in `Weather-Dashboard-UI-SPEC.md` — targets Apple Weather aesthetic: large temperatures, soft atmospheric surfaces, rounded cards, spacious layout
- **API constraints**: weatherapi.com free tier = 1,000 calls/day — caching and deduplication matter
- **Stack clarified**: SPEC.md originally listed Next.js while README/rule.md listed React+Vite+Express — resolved to **Next.js + API Routes** (single app, simpler Railway deployment)
- **API key**: Not yet obtained — needs weatherapi.com free tier signup before Phase 1 execution

## Constraints

- **Tech Stack**: Next.js 14+, TypeScript, TailwindCSS, Next.js API Routes — no separate Express backend
- **External API**: weatherapi.com free tier (1,000 calls/day) — must proxy through API Routes, never expose key to browser
- **Deployment**: Railway — must have working `npm run build && npm start` setup
- **State Management**: React Context — no Zustand/Redux unless scoping expands significantly
- **Security**: API key in `.env` only, `.env` in `.gitignore`, `.env.example` with placeholders committed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + API Routes over React+Vite+Express | Single app = simpler Railway deployment, no CORS config, API key proxying built-in | — Pending |
| React Context for state | No external state library needed for this scope | — Pending |
| weatherapi.com as sole weather source | Free tier sufficient, single integration simpler | — Pending |
| All nice-to-haves (forecast, geolocation, responsive) in v1 | Hobby project — might as well do it right | — Pending |

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
*Last updated: 2026-05-08 after initialization*
