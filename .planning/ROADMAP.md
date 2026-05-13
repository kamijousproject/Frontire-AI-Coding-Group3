# Roadmap: Frontier AI — Weather Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phase 01 (shipped 2026-05-12) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Local City Database + Instant Search** — Phases 02–04 (shipped 2026-05-13) — [archive](.planning/milestones/v1.1-ROADMAP.md)
- 🔄 **v1.2 Forecast, AQI, Auto-location & UI Polish** — Phases 05–07 (active)

## Phases

<details>
<summary>✅ v1.0 MVP (Phase 01) — SHIPPED 2026-05-12</summary>

- [x] Phase 01: Weather Dashboard MVP (3/3 plans) — completed 2026-05-12

</details>

<details>
<summary>✅ v1.1 Local City Database + Instant Search (Phases 02–04) — SHIPPED 2026-05-13</summary>

- [x] Phase 02: DB Foundation (3/3 plans) — completed 2026-05-12
- [x] Phase 03: Server & Persistence Layer (4/4 plans) — completed 2026-05-12
- [x] Phase 04: Autocomplete UI (1/1 plan) — completed 2026-05-13

</details>

### v1.2 Forecast, AQI, Auto-location & UI Polish

- [ ] **Phase 05: Weather Card Enrichment** — Add 5-day forecast panel and AQI display to each card
- [ ] **Phase 06: Auto-location** — Detect user's city on first load via IP, silently populate dashboard
- [ ] **Phase 07: UI Polish** — Loading indicator in SearchBar, aria-label, font-bold fix

## Phase Details

### Phase 05: Weather Card Enrichment
**Goal**: Each weather card shows a 5-day forecast and an AQI indicator alongside current conditions
**Depends on**: Phase 04 (complete)
**Requirements**: FCST-01, FCST-02, AQI-01, AQI-02
**Success Criteria** (what must be TRUE):
  1. Each card renders a forecast row with 5 days — date, high/low °C, condition icon
  2. A failed forecast fetch leaves the current-weather card intact (partial failure, no crash)
  3. AQI level (1–6) and label (e.g. "Good") appear on each card
  4. `WeatherData` type includes `aqi_level: number | null` and `aqi_label: string | null`
**Plans**: TBD

### Phase 06: Auto-location
**Goal**: On first load with an empty dashboard, the user's city is detected via IP and added automatically
**Depends on**: Phase 05
**Requirements**: LOC-01, LOC-02
**Success Criteria** (what must be TRUE):
  1. Fresh browser session with empty localStorage → dashboard auto-adds detected city without user action
  2. If `/api/v1/weather/location` fails → dashboard shows empty state silently, no error displayed
  3. Subsequent loads with cities already in localStorage → auto-location does NOT fire again
**Plans**: TBD

### Phase 07: UI Polish
**Goal**: Close the 3 UI audit gaps from v1.1 — loading indicator, aria-label, font weight
**Depends on**: Phase 04 (no dependency on 05–06)
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Typing in SearchBar and waiting 200ms shows a spinner or "Searching…" before results arrive
  2. Screen reader announces SearchBar input with name "Search for a city"
  3. No `font-semibold` class remains in `WeatherCard.tsx`; all bold text uses `font-bold`
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 01. Weather Dashboard MVP | v1.0 | 3/3 | Complete | 2026-05-12 |
| 02. DB Foundation | v1.1 | 3/3 | Complete | 2026-05-12 |
| 03. Server & Persistence Layer | v1.1 | 4/4 | Complete | 2026-05-12 |
| 04. Autocomplete UI | v1.1 | 1/1 | Complete | 2026-05-13 |
| 05. Weather Card Enrichment | v1.2 | 0/? | Not started | - |
| 06. Auto-location | v1.2 | 0/? | Not started | - |
| 07. UI Polish | v1.2 | 0/? | Not started | - |
