# Requirements: v1.2 Forecast, AQI, Auto-location & UI Polish

**Milestone:** v1.2
**Status:** Defined 2026-05-13
**Scope:** Enrich weather cards with forecast + AQI, auto-detect location on first load, close 3 UI audit gaps

---

## v1.2 Requirements

### Weather Card Enrichment

- [ ] **FCST-01**: Each weather card displays a 5-day forecast panel — date, high/low temp (°C/°F), condition icon, and condition text — fetched from `/api/v1/weather/forecast?q={lat},{lon}`
- [ ] **FCST-02**: Forecast data is cached server-side alongside current weather; a failed forecast fetch does not prevent the current weather card from rendering (graceful partial failure)
- [ ] **AQI-01**: Each weather card displays an air quality index (AQI) label — EPA level (1–6) and a human-readable descriptor (Good / Moderate / Unhealthy for Sensitive Groups / Unhealthy / Very Unhealthy / Hazardous) — fetched by passing `aqi=yes` on the `/current.json` weatherapi.com call
- [ ] **AQI-02**: The `WeatherData` type and `/api/v1/weather/current` route response include AQI fields: `aqi_level` (1–6) and `aqi_label` (string); AQI is `null` when unavailable (older cached responses)

### Auto-location

- [ ] **LOC-01**: On first load (empty dashboard / no cities in localStorage), the app automatically calls `/api/v1/weather/location` to detect the user's city via IP and adds it to the dashboard — no user action required
- [ ] **LOC-02**: If auto-location fails (IP lookup error, rate limit, or non-ok response), the dashboard shows empty state silently — no error message, no crash; user can add cities manually

### UI Polish (v1.1 Audit Gaps)

- [ ] **UI-01**: SearchBar shows a loading indicator (spinner or "Searching…" text) inside the dropdown panel from the moment the 200ms debounce timer fires until the fetch resolves or rejects
- [ ] **UI-02**: The SearchBar `<input>` element has `aria-label="Search for a city"` so screen readers announce an identifying name for the combobox
- [ ] **UI-03**: `WeatherCard` uses `font-bold` (weight 700) throughout — no `font-semibold` (weight 600) — matching the 2-weight typography spec (400 regular, 700 bold)

---

## Future Requirements (Deferred)

- M1-M8 manual browser tests (require live WEATHER_API_KEY + Railway deployment)
- Production deployment to Railway
- Hourly forecast breakdown within the 5-day panel
- AQI pollutant detail (CO, O3, NO2, PM2.5, PM10)
- Timezone-aware local time on each card

---

## Out of Scope

- **Pollen / marine / sports data** — niche; not part of core weather dashboard UX
- **Weather alerts** — adds UI complexity; defer to v1.3+
- **Bulk API requests** — requires Pro+ weatherapi.com plan; not available on free tier
- **Fuzzy city search** — deferred from v1.1; SQLite LIKE prefix is sufficient

---

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| FCST-01 | Phase 05 | — |
| FCST-02 | Phase 05 | — |
| AQI-01 | Phase 05 | — |
| AQI-02 | Phase 05 | — |
| LOC-01 | Phase 06 | — |
| LOC-02 | Phase 06 | — |
| UI-01 | Phase 07 | — |
| UI-02 | Phase 07 | — |
| UI-03 | Phase 07 | — |
