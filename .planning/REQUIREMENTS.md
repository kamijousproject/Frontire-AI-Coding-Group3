# Requirements: v1.1 Local City Database + Instant Search

**Milestone:** v1.1
**Status:** Defined 2026-05-12
**Scope:** SQLite-backed city autocomplete replacing live API city search

---

## v1.1 Requirements

### City Database

- [ ] **CITY-01**: `data/cities.db` SQLite file (~7,300 world cities) is committed to the repository and available at runtime on Railway
- [ ] **CITY-02**: `scripts/build-cities-db.mjs` converts Simplemaps Basic CSV to a `cities.db` SQLite file with schema: `id, name, city_ascii, country, region, lat, lon, timezone, population`

### Search API

- [ ] **API-01**: `/api/cities/search?q={query}` server-side endpoint queries `cities.db` via SQLite and returns a `CityEntry[]` array (id, name, country, region, lat, lon, timezone)
- [ ] **API-02**: `/api/weather/current` and `/api/weather/multiple` accept lat/lon coordinates (e.g. `?q=13.7500,100.5170`) instead of city name strings
- [ ] **API-03**: `/api/weather/multiple` uses pipe-separated coordinate pairs as its city list parameter (e.g. `?cities=13.7500:100.5170|48.8600:2.3500`) to avoid ambiguity with comma-separated lat/lon values

### Autocomplete UI

- [ ] **AUTO-01**: SearchBar triggers autocomplete after ≥2 characters with 200ms debounce; each outgoing request is cancelled via AbortController when a new debounce fires
- [ ] **AUTO-02**: Suggestions display in `City, Region, Country` format (region omitted if null); ranked by population DESC within prefix matches; maximum 8 suggestions shown; "No cities found for '{input}'" shown when results are empty
- [ ] **AUTO-03**: Suggestion dropdown supports keyboard navigation: ↑↓ arrows move the highlighted item, Enter adds the selected city to the dashboard, Escape closes the dropdown, Tab dismisses without selecting
- [ ] **AUTO-04**: The characters the user typed are highlighted (bold) in each suggestion row to show the matched prefix

### Persistence

- [ ] **PERSIST-01**: City list is stored under the new localStorage key `weather_cities_v2` as `CityEntry[]` (id, name, country, region, lat, lon, timezone); duplicate detection uses `city.id` instead of city name string
- [ ] **PERSIST-02**: If the old v1.0 `string[]` format is detected on load, the dashboard resets silently to an empty state; no migration is attempted (lat/lon cannot be recovered from stored city name strings)

---

## Future Requirements (Deferred)

- Timezone display in autocomplete suggestions (v2.0)
- Fuzzy / partial name matching (v2.0)
- Geolocation-based city suggestions (v2.0)
- Recent searches list (v2.0)
- Startup row-count validation log for `cities.db` (future)

---

## Out of Scope

- **Client-side pre-loaded city list** — would expose ~300–500 KB binary to every browser session; server-side route is the correct approach
- **Fuzzy matching** — SQLite `LIKE` prefix + substring is sufficient for 7,300 cities; Levenshtein adds complexity with negligible UX benefit
- **User accounts or server-side city persistence** — localStorage-only, consistent with v1.0 scope
- **Multiple pages or navigation** — single-page dashboard; city detail page deferred

---

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| CITY-01 | Phase 02 | — |
| CITY-02 | Phase 02 | — |
| API-01 | Phase 03 | — |
| API-02 | Phase 03 | — |
| API-03 | Phase 03 | — |
| PERSIST-01 | Phase 03 | — |
| PERSIST-02 | Phase 03 | — |
| AUTO-01 | Phase 04 | — |
| AUTO-02 | Phase 04 | — |
| AUTO-03 | Phase 04 | — |
| AUTO-04 | Phase 04 | — |
