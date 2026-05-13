# MILESTONES

## v1.2 — Forecast, Auto-location & Modern UI

**Shipped:** 2026-05-13
**Phases:** 05–07 | **Plans:** 3
**Git range:** (current HEAD)

### Delivered

A complete visual overhaul with 5-day weather forecast panels, automatic location detection on first load, and enhanced user controls. The UI now features a modern glassmorphism design system with dynamic weather-based gradients, drag-and-drop city reordering, temperature unit toggle, and manual refresh capability.

### Key Accomplishments

1. **5-Day Forecast Panel** — Expandable forecast in each WeatherCard showing date, high/low temperatures, condition icons; fetched from `/api/v1/weather/forecast`
2. **Auto-location on First Load** — Browser geolocation API requests permission when dashboard is empty; gracefully falls back to empty state on denial
3. **Complete UI Redesign** — Glassmorphism cards, dynamic gradients based on weather conditions (sunny, cloudy, rain, snow, thunder), hover effects
4. **Temperature Unit Toggle** — °C / °F switch in header with localStorage persistence; affects all temperature displays
5. **Manual Refresh Button** — Header control to bypass cache and reload all weather data with loading indicator
6. **City Drag & Drop Reordering** — HTML5 DND API with localStorage persistence for custom city ordering
7. **Enhanced SearchBar** — Search icon, dark themed dropdown, location pin icons in suggestions, error states
8. **New API Routes** — `/api/v1/weather/forecast` (5-day forecast), `/api/v1/weather/location` (lat/lon-based weather lookup)
9. **New React Hooks** — `useUnitPreference`, `useGeolocation`, enhanced `useWeather` with forecast fetching and refresh capability

### Known Deferred at Close

- Air Quality Index (AQI) display — requires weatherapi.com AQI integration
- Hourly forecast breakdown within 5-day panel
- M1-M8 manual browser tests (require live WEATHER_API_KEY + Railway deployment)
- Production deployment with real WEATHER_API_KEY

---

## v1.1 — Local City Database + Instant Search

**Shipped:** 2026-05-13
**Phases:** 02–04 | **Plans:** 8 | **Tasks:** ~20
**Git range:** 3bb21f4 → 0272c83
**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

### Delivered

Replaced live weatherapi.com city search with a bundled SQLite database of 7,300 world cities. Added a full ARIA combobox autocomplete SearchBar with 200ms debounce, AbortController race cancellation, keyboard navigation, and bold prefix highlighting. Weather lookups now use lat/lon coordinates for precision. localStorage schema migrated to `CityEntry[]` with silent v1 reset.

### Key Accomplishments

1. SQLite city database (7,300 cities) bundled in repo — `data/cities.db` queryable on Railway with zero network cost
2. better-sqlite3 HMR-safe singleton (`getDb()`) — no multi-handle race on hot reload
3. `/api/cities/search` server-side prefix search with population-ranked results (LIMIT 8)
4. Coordinate-based weather API — `?q=lat,lon` and `?cities=lat:lon|lat:lon` pipe/colon format
5. localStorage v2 migration — `CityEntry[]` with `weather_cities_v2` key; v1 string-array silently discarded
6. Full ARIA combobox SearchBar — ↑↓ Enter Escape Tab keyboard nav, bold prefix via `<strong>`, UAT 4/4 passed

### Known Deferred at Close

- M1-M8 manual browser tests (require live WEATHER_API_KEY + Railway deployment)
- Loading indicator during 200ms debounce fetch window (UX gap, UI audit finding)
- `aria-label` on SearchBar input (accessibility gap, UI audit finding)
- Production deployment with real WEATHER_API_KEY

---

## v1.0 MVP — Weather Dashboard MVP

**Shipped:** 2026-05-12  
**Phases:** 1 | **Plans:** 3 | **Tasks:** 18  
**Git range:** fa185d7 → 8ed2eb8  
**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

### Delivered

A Next.js 16 server-side weather dashboard that tracks multiple cities via weatherapi.com, with persistent localStorage city lists, a secure server-side API proxy (rate limiting, caching, no key exposure), and a responsive React UI with dynamic weather-condition backgrounds.

### Key Accomplishments

1. Foundation library suite — TypeScript discriminated unions, 10-min server-side cache, per-IP rate limiter, weatherapi.com client with timeout/icon normalization
2. 4-endpoint API proxy layer — health, current weather, multi-city (partial success), city search; all rate-limited and cached
3. Full React UI — SearchBar with debounced search, WeatherCard with bounded retry, WeatherGrid with responsive 1/2/3-col layout and dynamic page background
4. LocalStorage persistence hook with silent parse-error recovery
5. 26/26 static UAT checks passed; build and TypeScript clean
6. Railway deployment config (NIXPACKS) ready for cloud deployment

### Known Deferred at Close

- M1-M8 manual browser tests (require live WEATHER_API_KEY in .env.local)
