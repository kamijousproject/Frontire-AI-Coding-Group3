# Research Summary: v1.1 Local City Database + Instant Search

**Project:** Frontire AI — Weather Dashboard
**Researched:** 2026-05-12
**Confidence:** HIGH (stack, architecture, features), MEDIUM (Railway native binary)

---

## Executive Summary

v1.1 replaces the live weatherapi.com city search with a locally committed SQLite database (~7,300 cities, Simplemaps Basic, MIT) queried via `better-sqlite3`. The change eliminates per-keystroke external network calls and enables coordinate-based weather fetches (more precise than city-name strings).

The key deployment risk is `better-sqlite3`'s native C++ addon failing to compile on Railway. Mitigation: three-tier fallback — prebuilt binary → `nixpacks.toml` override → pivot to JSON array (~2-3h rework). The second risk is a breaking localStorage schema change (`string[]` → `CityEntry[]`); fix is a new storage key (`weather_cities_v2`), not migration logic.

Non-negotiable build order: **DB → types → API routes → weather integration → SearchBar UI.**

---

## Stack Additions

**One new runtime dependency:** `better-sqlite3 ^12.4.1` + `@types/better-sqlite3`

**Two mandatory `next.config.ts` changes:**
- `serverExternalPackages: ['better-sqlite3']` — prevents webpack bundling the native binary (silent runtime crash if omitted)
- `outputFileTracingIncludes: { '/*': ['./cities.db'] }` — ensures DB file survives `next build` tracing

**City data:** Simplemaps World Cities Basic — free, MIT, ~7,300 cities, ~300-500 KB as SQLite, includes `city_ascii` for normalized search.

**Rejected:** dr5hn (89 MB — too large to commit), fuse.js (fuzzy overkill for 7K cities), sql.js WASM (startup overhead for read-only).

**Railway fallback:** If native compilation fails after two attempts, pivot to `cities.json` array + `Array.filter` prefix match. ~1ms at 7,300 cities, zero native dependencies.

---

## Feature Table Stakes

| Feature | Spec |
|---------|------|
| Min query length | 2 characters |
| Debounce | 200ms (reduce from current 300ms — SQLite is <5ms) |
| Max suggestions | 8 |
| Ranking | Prefix match first, then population DESC |
| Display format | `{City}, {Region}, {Country}` (region omitted if null) |
| Prefix highlight | Bold matched characters |
| Keyboard nav | ↑↓ Enter Escape Tab |
| Click-outside dismiss | Yes |
| Empty state | "No cities found for '{input}'" |
| Duplicate detection | Compare by `city.id`, not `city.name` |
| AbortController | Cancel in-flight requests on each new debounce fire |
| Weather fetch | `?q=lat,lon` via `toFixed(4)` (e.g. `?q=13.7500,100.5170`) |

**Defer to v2+:** timezone in suggestions, fuzzy matching, geolocation, recent searches.

---

## Architecture Decisions

**DB file:** `data/cities.db` at project root (not `public/` — would be publicly downloadable).

**Path:** Always `path.join(process.cwd(), 'data', 'cities.db')`. Never `__dirname` — App Router compiles handlers into `.next/server/app/...`.

**Connection:** Process-level singleton in `src/lib/db.ts` using `global.__db` to survive HMR. Options: `{ readonly: true, fileMustExist: true }`.

**API route:** `/api/v1/cities/search` URL unchanged — implementation changes from weatherapi.com call to SQLite SELECT. Returns `CityEntry[]` (with lat/lon). `fetchCitySearch` in `weatherapi.ts` removed entirely.

**Weather fetch param:** `?q=lat,lon` (comma, no spaces). Multiple-city delimiter changes from comma to pipe `|` with colon `:` inside pairs: `?cities=13.7500:100.5170|48.8600:2.3500`.

**localStorage:** New key `weather_cities_v2` storing `CityEntry[]`. Old key orphaned (cannot recover lat/lon from city name string).

**Build order:**
1. `data/cities.db` + build script
2. `better-sqlite3` install + `next.config.ts`
3. `src/lib/db.ts` singleton
4. `src/types/weather.ts` — add `CityEntry` **(all downstream depends on this)**
5. `/api/v1/cities/search/route.ts` — SQLite replaces weatherapi call
6. `src/lib/validation.ts` — add `validateCoordCitiesParam`
7. `src/lib/weatherapi.ts` — `fetchCurrentWeather(lat, lon)`, remove `fetchCitySearch`
8. `/api/v1/weather/current` + `/multiple` — accept coord params (one commit)
9. `src/hooks/useLocalStorage.ts` — `CityEntry[]`, new key
10. `src/hooks/useWeather.ts` — build coord URLs
11. `src/components/SearchBar.tsx` — AbortController, 200ms debounce, emit `CityEntry`
12. `src/components/WeatherGrid.tsx` — key on `city.id`

**Unchanged:** `WeatherCard.tsx`, `rate-limit.ts`, `condition-backgrounds.ts`, `health/route.ts`.

---

## Critical Pitfalls

**CRITICAL-1: Wrong webpack config key**
Use `serverExternalPackages` (Next.js 15+). Old name `serverComponentsExternalPackages` silently does nothing; app crashes on first DB call in production.

**CRITICAL-2: `__dirname` for DB path**
`__dirname` points to `.next/server/app/api/...` in production. Use `process.cwd()` exclusively.

**CRITICAL-3: Railway native compilation failure**
Recovery path: `nixpacks.toml` with `nixPkgs = ["python3", "gcc", "gnumake"]`. After two failed attempts: pivot to JSON.

**CRITICAL-4: localStorage schema collision**
Old `string[]` silently gets discarded by the new type guard → empty dashboard for existing users. Use new key `weather_cities_v2`.

**MOD-1: Stale dropdown race condition**
SQLite is <5ms — rapid typists will trigger out-of-order responses. Add `AbortController` per fetch. Current SearchBar does not cancel in-flight requests.

**MOD-2: Coordinate format inconsistency**
Use `toFixed(4)` on all lat/lon values before building API URLs or cache keys.

---

## Empirical Validations Needed During Execution

| When | What | Risk if Skipped |
|------|------|-----------------|
| Phase A, first Railway deploy | `better-sqlite3` compiles without `node-gyp` errors | Deploy fails silently or at startup |
| Phase C, before wiring routes | `?q=lat,lon` returns same `WeatherData` shape from weatherapi.com | Weather routes broken for all cities |
| Phase A | `data/cities.db` file size within git limits | Large binary in repo history |
