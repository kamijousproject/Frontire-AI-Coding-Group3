## Project Description

**Project C: Weather Dashboard** is a web application that allows users to search and view real-time weather information for multiple cities simultaneously.

The application fetches live data from **weatherapi.com** (free tier: 1,000 calls/day, server-side cached) and displays it through a clean, responsive UI. Users can search for any city by name, view current conditions (temperature, feels-like, humidity, wind speed, condition), and check a 5-day forecast or detect their location via geolocation.

### Key Goals

- Display current weather for up to **10 cities** simultaneously
- City search with **300ms debounce**, minimum **2 characters**, returns up to **5 results** in a dropdown
- Handle external API data (JSON) and render it cleanly on the UI
- Proxy all weatherapi.com calls through Next.js API Routes — API key never exposed to client

### Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (built-in) — acts as API proxy
- **External API**: weatherapi.com
- **Deployment**: Railway (single instance)
- **Database**: SQLite store the all cities in the world

### Frontend Style

- **TailwindCSS** for all styling
- **Mobile-first responsive design** — MUST-have; layout adapts to mobile, tablet, and desktop
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- **Grid columns**: 1-col on mobile, 2-col at `md`, 3-col at `lg`
- Search bar and inputs optimized for touch on mobile
- **Page background** — changes based on first city's `condition_code` (index 0 in city list); falls back to neutral gray gradient when no cities added
- **Card background** — each card has a subtle tint matching its own city's `condition_code` (see condition map below)
- **Day/night variant** — use `is_day` field: `1` = day variant, `0` = night variant per condition group

#### Weather Condition → Background Map

| Condition Group | `condition.code` | Day Background | Night Background |
|---|---|---|---|
| Sunny / Clear | 1000 | Bright blue gradient | Deep navy gradient |
| Partly cloudy | 1003 | Light gray-blue gradient | Dark blue-gray gradient |
| Cloudy / Overcast | 1006–1009 | Gray gradient | Dark gray gradient |
| Rain / Drizzle / Showers | 1063, 1150–1201, 1240–1246 | Dark blue gradient | Darker blue gradient |
| Snow / Sleet / Blizzard | 1066, 1114–1117, 1210–1237, 1255–1264 | White/light blue gradient | Light navy gradient |
| Thunder / Storm | 1087, 1273–1282 | Dark purple gradient | Near-black purple gradient |
| Fog / Mist / Haze | 1030, 1135, 1147 | Muted gray gradient | Dark muted gray gradient |
| Unknown / fallback | any other code | Neutral gray gradient | Neutral dark gray gradient |

Full code list: https://www.weatherapi.com/docs/weather_conditions.json

---

## 1. Must-have

Features required for the project to be considered complete.

- **Multi-city display** — up to **10 cities** simultaneously; minimum 1; no duplicate cities (case-insensitive match); adding duplicate shows inline error below search input: "City already added" — disappears after **3 seconds** or on next keypress
- **Current weather** — per card: temperature as `18°C / 65°F` (both units simultaneous, no toggle), feels-like temp same format, humidity (%), wind speed (km/h), condition text + icon
- **City search** — 300ms debounce, min 2 chars to trigger, max 5 results in **dropdown below input**; dropdown closes on outside click or Escape key; each result shows `City, Region, Country` for disambiguation; when 10 cities already added, results still show but each result is disabled with tooltip "City list full (10/10)"
- **City removal** — X button top-right of each card; removes immediately, no confirmation dialog; city removed from `localStorage`
- **Responsive design** — mobile-first; all breakpoints functional; 1/2/3-col grid as specified above
- **Empty states** — initial load: "Search for a city to get started"; search no results: "No cities found"; failed card load: per-card error message showing `ErrorResponse.error` text + single retry button
- **Failed card retry** — retry button calls `GET /api/v1/weather/current` for that city once immediately; if second attempt also fails, replace retry button with static message "Unable to load weather data" (no further retry)
- **City persistence** — city list stored in `localStorage` key `weather_cities` as `string[]` of city names (lowercased, trimmed); restored on page reload; on parse error or invalid type, reset to `[]` silently; on restore, truncate to first 10 entries if >10 found; stale data stays until user removes city or re-adds

---

## 2. Nice-to-have

Features that improve the experience but are not required.

- **5-day forecast** — expandable section at the bottom of each weather card; collapsed by default; tap/click to expand; shows days 1–5 from today (not today) as a horizontal row of day-tiles; each tile: abbreviated day name (Mon/Tue/…), condition icon (day variant always — forecast cards do not use `is_day`), high/low temp as `22°C / 72°F`; collapses on second tap
- **Geolocation** — auto-detect on page load via browser Geolocation API; if denied or unavailable, show empty state silently (no error modal); resolved city name from weatherapi.com `location.name` stored in `localStorage` as lowercased trimmed string, same as search-added cities; if resolved name matches an existing city (case-insensitive), treat as duplicate and do not add

---

## 3. Technical Challenge

- **External API integration** — weatherapi.com free tier: 1,000 calls/day; server-side cache **10-minute TTL** per city (case-insensitive, trimmed key) prevents quota exhaustion; no auto-refresh mid-session — data stays stale until user removes and re-adds city
- **JSON data processing** — transform weatherapi.com response to internal `WeatherData` schema (see §4); normalize all `icon_url` values from `//cdn...` to `https://cdn...`

---

## 4. Data Models

### WeatherData

```typescript
interface WeatherData {
  type: 'data';           // explicit discriminant for MultiWeatherResult
  city: string;           // "London" — raw value from weatherapi.com location.name (e.g. "United Kingdom", not "UK")
  country: string;        // "United Kingdom" — raw from weatherapi.com, not abbreviated
  region: string;         // "City of London, Greater London"
  temp_c: number;         // e.g. 18.5
  temp_f: number;         // e.g. 65.3
  feelslike_c: number;
  feelslike_f: number;
  humidity: number;       // 0–100 (%)
  wind_kph: number;
  condition: string;      // "Partly cloudy"
  condition_code: number; // weatherapi.com condition code
  icon_url: string;       // "https://cdn.weatherapi.com/weather/64x64/day/116.png" (always https://)
  is_day: number;         // 1 = day, 0 = night — used for background day/night variant
  last_updated: string;   // ISO 8601 UTC e.g. "2026-05-08T10:00:00Z"
}
```

### ForecastDay (nice-to-have)

```typescript
interface ForecastDay {
  date: string;        // "2026-05-09" — UTC date (YYYY-MM-DD)
  maxtemp_c: number;
  mintemp_c: number;
  maxtemp_f: number;
  mintemp_f: number;
  condition: string;
  condition_code: number;
  icon_url: string;    // always https://
  // No is_day field — forecast tiles always use day variant of condition background
}
```

### CitySearchResult

```typescript
interface CitySearchResult {
  name: string;    // "Paris"
  region: string;  // "Ile-de-France"
  country: string; // "France"
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: string; // human-readable message
  code: number;  // app error code (see table below)
}
```

### MultiWeatherResult (for `/weather/multiple`)

```typescript
interface WeatherError {
  type: 'error';  // explicit discriminant — use this, not structural duck-typing
  city: string;
  error: string;
  code: number;
}

type MultiWeatherResult = WeatherData | WeatherError;
// Discriminate via: item.type === 'data' → WeatherData; item.type === 'error' → WeatherError
```

#### App Error Codes

| Code | Meaning |
|---|---|
| 1001 | City not found |
| 1002 | weatherapi.com rate limit exceeded (1,000/day) |
| 1003 | weatherapi.com unreachable or timeout (5s) |
| 1004 | Invalid query parameter |
| 1005 | Max cities limit exceeded (>10) |

---

## 5. API Specification

### Constraints (all endpoints)

- **Rate limiting**: 60 requests/minute per IP; extract client IP from **last** value in `X-Forwarded-For` header (Railway appends real client IP to the end — first value is client-controlled and spoofable); in-memory counter acceptable for MVP single-instance Railway deployment (resets on restart — known limitation)
- **Input validation**: `city` and `q` params — max 100 chars, pattern `^[a-zA-Z0-9 ,'\-\.]+$`; reject with 400 + code 1004 before forwarding upstream; for `cities` (comma-separated), each element after split+trim must also be 2–100 chars and match pattern — reject whole request with 400 + code 1004 if any element fails, including empty-string elements
- **Timeout**: 5 seconds to weatherapi.com; respond 503 + code 1003 on timeout
- **CORS**: same-origin only; no `Access-Control-Allow-Origin: *`
- **API key**: `WEATHER_API_KEY` env var — server-side only, never `NEXT_PUBLIC_` prefix, never in any response body or header

### `GET /api/v1/health`

Local check only — does **not** ping weatherapi.com. Returns `ok` if process is running.

Response `200`:
```json
{ "status": "ok", "timestamp": "2026-05-08T10:00:00Z" }
```

### `GET /api/v1/weather/current?city={name}`

| Param | Type | Required | Constraints |
|---|---|---|---|
| `city` | string | yes | 2–100 chars, pattern above |

| Status | Body |
|---|---|
| 200 | `WeatherData` |
| 400 | `ErrorResponse` code 1004 |
| 404 | `ErrorResponse` code 1001 |
| 429 | `ErrorResponse` code 1002 |
| 503 | `ErrorResponse` code 1003 |

Cache: server-side **10 minutes** per `city` key (lowercased, trimmed).

### `GET /api/v1/weather/multiple?cities={c1,c2,...}`

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cities` | comma-separated string | yes | 1–10 city names after split+trim; each element 2–100 chars; server deduplicates before fetching |

| Status | Body |
|---|---|
| 200 | `MultiWeatherResult[]` — length equals deduplicated city count |
| 400 | `ErrorResponse` code 1005 if >10 cities after dedup |
| 400 | `ErrorResponse` code 1004 if any element fails validation (empty, too short, bad chars) |

Partial success: all cities attempted; failed cities return `WeatherError` (with `type: 'error'`) in array; 200 status regardless of partial failure.

### `GET /api/v1/cities/search?q={keyword}`

| Param | Type | Required | Constraints |
|---|---|---|---|
| `q` | string | yes | 2–100 chars |

| Status | Body |
|---|---|
| 200 | `CitySearchResult[]` max 5 results; empty array `[]` if no match |
| 400 | `ErrorResponse` code 1004 |

### `GET /api/v1/weather/forecast?city={name}` *(nice-to-have)*

| Param | Type | Required | Constraints |
|---|---|---|---|
| `city` | string | yes | 2–100 chars |

| Status | Body |
|---|---|
| 200 | `ForecastDay[]` — exactly 5 items (days 1–5 from today, UTC) |
| 400 | `ErrorResponse` code 1004 |
| 404 | `ErrorResponse` code 1001 |

### `GET /api/v1/weather/location?lat={lat}&lon={lon}` *(nice-to-have)*

| Param | Type | Required | Constraints |
|---|---|---|---|
| `lat` | float | yes | -90.0 to 90.0 |
| `lon` | float | yes | -180.0 to 180.0 |

Response `200`: `WeatherData` — `city` field populated from weatherapi.com `location.name` of resolved coordinates.  
Response `400`: `ErrorResponse` code 1004 if out of range.

---

## 6. Security Requirements

Non-negotiable implementation requirements:

1. `WEATHER_API_KEY` must be server-side only — **never** name it `NEXT_PUBLIC_WEATHER_API_KEY`
2. API key must never appear in any client bundle, network response, or log
3. All weatherapi.com HTTP calls made from API Routes only — never from browser
4. Rate limiting (60 req/min/IP via **last** value in `X-Forwarded-For`) must be applied to all `/api/v1/*` routes including `/health`
5. Input validation must reject non-conforming params with 400 **before** forwarding to weatherapi.com; includes per-element validation on comma-separated `cities` param
6. All `icon_url` values must be normalized to `https://` before returning to client

---

## 7. Requirement Coverage

| # | Requirement | Priority | Covered By |
|---|---|---|---|
| 1 | Multi-city display (max 10, no dupes, full-list disabled state) | Must-have | §5 `GET /api/v1/weather/multiple` |
| 2 | Current weather (exact fields, both units) | Must-have | §4 `WeatherData` / `GET /api/v1/weather/current` |
| 3 | City search (dropdown, debounce 300ms, min 2, max 5) | Must-have | §5 `GET /api/v1/cities/search` |
| 4 | City removal (X button) | Must-have | §1 Must-have |
| 5 | Responsive design (1/2/3-col grid) | Must-have | §1 Frontend Style / TailwindCSS |
| 6 | Empty + error states + retry (one attempt) | Must-have | §1 Must-have / §4 `ErrorResponse` |
| 7 | City persistence (`localStorage` as `string[]`, parse recovery, 10-cap) | Must-have | §1 Must-have |
| 8 | 5-day forecast (expandable card section, day variant) | Nice-to-have | §5 `GET /api/v1/weather/forecast` |
| 9 | Geolocation (graceful fallback, dedup vs existing cities) | Nice-to-have | §5 `GET /api/v1/weather/location` |
| 10 | weatherapi.com integration (10m cache, no mid-session refresh) | Challenge | §3 / §5 cache spec |
| 11 | JSON data processing (schema transform + icon normalization) | Challenge | §4 `WeatherData` / `ForecastDay` |

---

## 8. MVP Scope

Must include requirements 1–7, 10, 11.

### MVP API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check (local only) |
| GET | `/api/v1/weather/current` | Current weather by city (10m cache) |
| GET | `/api/v1/weather/multiple` | Weather for 1–10 cities (deduped) |
| GET | `/api/v1/cities/search` | Search cities, max 5 results |

### Deployment (Railway)

| Service | Railway Config |
|---|---|
| Next.js app | Web Service — `npm run build && npm start` |
| Environment | `WEATHER_API_KEY` — server-side only, never `NEXT_PUBLIC_` prefix |

> **Note**: Rate limiting uses in-memory counter. Single-instance deployment only. Counter resets on restart — acceptable for hackathon MVP.

---

## 9. Out of Scope (v1.0)

- User account system (login, register, password)
- Historical weather analytics
- Weather map layer
- Social sharing
- Multi-provider weather comparison
- Paid subscription
- Temperature unit toggle (both units shown simultaneously)
- Auto-refresh of weather data mid-session
- Multi-instance rate limiting (Upstash Redis)
- Wind direction (only wind speed in km/h is shown)
- UV index, visibility, pressure, or any weather field not listed in `WeatherData` §4
- Weather animations or animated backgrounds

---

## 10. UI Design Reference

The HTML mockup at `ui-design-guide/WeatherApp_standalone_.html` is a **visual reference only**.

**Precedence rule**: spec text (this document) is authoritative for feature scope, data fields, and behavior. If the HTML design shows a field, feature, or interaction not specified in §1–§8, it is out of scope for v1.0 and must not be built without an explicit spec update.
