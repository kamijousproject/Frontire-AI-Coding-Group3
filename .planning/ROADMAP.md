# Roadmap: Frontier AI — Weather Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phase 01 (shipped 2026-05-12) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🔄 **v1.1 Local City Database + Instant Search** — Phases 02–04 (active)

## Phases

<details>
<summary>✅ v1.0 MVP (Phase 01) — SHIPPED 2026-05-12</summary>

- [x] Phase 01: Weather Dashboard MVP (3/3 plans) — completed 2026-05-12
  - [x] 01-01: Foundation — Types, Libs, Infra
  - [x] 01-02: API Layer — Routes
  - [x] 01-03: UI — Components, Hooks, Assembly, Deployment

</details>

### v1.1 Local City Database + Instant Search

- [ ] **Phase 02: DB Foundation** — Bundle cities.db and validate Railway native compilation
- [ ] **Phase 03: Server & Persistence Layer** — SQLite search route, coord-based weather API, localStorage schema migration
- [ ] **Phase 04: Autocomplete UI** — SearchBar instant type-ahead, keyboard nav, match highlighting

## Phase Details

### Phase 02: DB Foundation
**Goal**: The city database is committed to the repo and the Railway build compiles better-sqlite3 natively without errors
**Depends on**: Phase 01 (complete)
**Requirements**: CITY-01, CITY-02
**Success Criteria** (what must be TRUE):
  1. `data/cities.db` exists in the repository and is queryable at runtime (Railway does not strip it at build time)
  2. `scripts/build-cities-db.mjs` runs cleanly and produces a valid SQLite file with the correct schema (id, name, city_ascii, country, region, lat, lon, timezone, population)
  3. A Railway deployment completes without `better-sqlite3` native compilation errors (or the JSON fallback path is documented and unblocked)
  4. `next.config.ts` contains `serverExternalPackages: ['better-sqlite3']` and `outputFileTracingIncludes` so the DB file survives `next build` tracing
**Plans**: 3 plans

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Install better-sqlite3 + configure next.config.ts

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 02-02-PLAN.md — worldcities.csv + build script + generate and commit cities.db
- [ ] 02-03-PLAN.md — src/lib/db.ts HMR-safe singleton

### Phase 03: Server & Persistence Layer
**Goal**: The server exposes a coordinate-based weather API and a SQLite-backed city search endpoint, and the localStorage schema is migrated to CityEntry[]
**Depends on**: Phase 02
**Requirements**: API-01, API-02, API-03, PERSIST-01, PERSIST-02
**Success Criteria** (what must be TRUE):
  1. `GET /api/cities/search?q=bang` returns a `CityEntry[]` JSON array from SQLite with id, name, country, region, lat, lon, and timezone fields
  2. `GET /api/weather/current?q=13.7500,100.5170` returns the same `WeatherData` shape as the previous city-name query (weatherapi.com accepts lat,lon)
  3. `GET /api/weather/multiple?cities=13.7500:100.5170|48.8600:2.3500` returns a partial-success multi-city payload using the pipe/colon delimiter format
  4. On a fresh browser session, `localStorage.getItem('weather_cities_v2')` stores a `CityEntry[]` array; the old `weather_cities` string-array key is ignored and produces an empty dashboard silently
**Plans**: TBD

### Phase 04: Autocomplete UI
**Goal**: Users can find and add any of 7,300 cities instantly via a type-ahead dropdown with full keyboard support
**Depends on**: Phase 03
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04
**Success Criteria** (what must be TRUE):
  1. Typing 2+ characters in the SearchBar triggers a debounced fetch to `/api/cities/search`; no request fires before 2 characters or before 200ms have elapsed; switching input rapidly does not leave stale results (AbortController cancels in-flight requests)
  2. The dropdown shows up to 8 suggestions in `City, Region, Country` format (region omitted if null), ranked by population DESC; when no results match, the text "No cities found for '{input}'" is shown
  3. Pressing ↑/↓ moves the highlighted suggestion; Enter adds the highlighted city to the dashboard; Escape closes the dropdown; Tab dismisses without selecting
  4. The characters the user typed appear bold (highlighted) in each suggestion row, making the prefix match visually distinct
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 01. Weather Dashboard MVP | v1.0 | 3/3 | Complete | 2026-05-12 |
| 02. DB Foundation | v1.1 | 1/3 | In Progress|  |
| 03. Server & Persistence Layer | v1.1 | 0/? | Not started | - |
| 04. Autocomplete UI | v1.1 | 0/? | Not started | - |
