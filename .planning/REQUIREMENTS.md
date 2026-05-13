# Requirements: v1.2 Forecast, Auto-location & Modern UI

**Milestone:** v1.2
**Status:** Shipped 2026-05-13
**Scope:** Enrich weather cards with forecast, auto-detect location on first load, complete UI redesign, add user controls

---

## v1.2 Requirements

### Weather Card Enrichment

- [x] **FCST-01**: Each weather card displays a 5-day forecast panel — date, high/low temp (°C/°F), condition icon, and condition text — fetched from `/api/v1/weather/forecast?q={lat},{lon}`
- [x] **FCST-02**: Forecast data is fetched client-side alongside current weather; a failed forecast fetch does not prevent the current weather card from rendering (graceful partial failure)
- [ ] **AQI-01**: Each weather card displays an air quality index (AQI) label — EPA level (1–6) and a human-readable descriptor — fetched by passing `aqi=yes` on the `/current.json` weatherapi.com call
- [ ] **AQI-02**: The `WeatherData` type and `/api/v1/weather/current` route response include AQI fields: `aqi_level` (1–6) and `aqi_label` (string)

### Auto-location

- [x] **LOC-01**: On first load (empty dashboard / no cities in localStorage), the app automatically requests browser geolocation permission and adds the detected city to the dashboard
- [x] **LOC-02**: If auto-location fails (permission denied, timeout, or error), the dashboard shows empty state silently — no error message, no crash; user can add cities manually or retry

### UI Polish & Enhancements

- [x] **UI-01**: SearchBar enhanced with search icon, dark themed dropdown, and location icons in suggestions
- [x] **UI-02**: Complete UI redesign with glassmorphism cards, dynamic weather-based gradients, and modern typography
- [x] **UI-03**: Temperature unit toggle (°C / °F) with localStorage persistence
- [x] **UI-04**: Manual refresh button to bypass cache and reload weather data
- [x] **UI-05**: City drag & drop reordering with localStorage persistence
- [x] **UI-06**: WeatherCard displays dynamic gradients based on weather condition (sunny, cloudy, rain, snow, thunder)
- [x] **UI-07**: Hover effects on cards with remove button reveal
- [x] **UI-08**: Loading states — spinner in cards, refresh button loading state, geolocation loading indicator

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

| REQ-ID | Phase | Status |
|--------|-------|--------|
| FCST-01 | Phase 05 | ✅ Complete |
| FCST-02 | Phase 05 | ✅ Complete |
| AQI-01 | Phase 05 | ⏸️ Deferred |
| AQI-02 | Phase 05 | ⏸️ Deferred |
| LOC-01 | Phase 06 | ✅ Complete (browser geolocation, not IP) |
| LOC-02 | Phase 06 | ✅ Complete |
| UI-01 | Phase 07 | ✅ Complete (enhanced beyond original spec) |
| UI-02 | Phase 07 | ✅ Complete (full redesign) |
| UI-03 | Phase 07 | ✅ Complete (unit toggle added) |
| UI-04 | Phase 07 | ✅ Complete (refresh button) |
| UI-05 | Phase 07 | ✅ Complete (drag & drop) |
| UI-06 | Phase 07 | ✅ Complete (dynamic gradients) |
| UI-07 | Phase 07 | ✅ Complete (hover effects) |
| UI-08 | Phase 07 | ✅ Complete (loading states) |
