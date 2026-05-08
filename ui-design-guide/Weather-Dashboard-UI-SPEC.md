# Weather Dashboard UI Specification

Project: Frontire-AI-Coding - Weather Dashboard Web Application  
Version: 1.0 UI Draft  
Target stack: Next.js, TypeScript, TailwindCSS  
Deployment: Railway

---

## 1. Product Intent

The interface should help users quickly search for a city, compare current weather across multiple cities, and understand basic weather conditions without reading dense data tables.

The first screen should be the usable dashboard, not a landing page. Users should immediately see a search input, default city weather cards, loading/error states when needed, and a clear path to add more cities.

The app must be fully responsive. Use Apple Weather as the visual guideline: simple, polished, weather-first, spacious, and professional. The design should borrow the feeling of large readable temperatures, soft atmospheric surfaces, rounded weather panels, and clear forecast-like hierarchy without copying Apple branding or requiring complex animation.

---

## 2. MVP User Goals

1. Search for a city by name.
2. Select a city from search results.
3. View current weather for one city.
4. View current weather for at least three cities at the same time.
5. Understand loading, empty, not found, and network error states.
6. Use the dashboard comfortably on mobile, tablet, and desktop.

---

## 3. Information Architecture

### Primary Route

`/`

Dashboard view containing:

1. App header
2. City search
3. Current weather summary area
4. Multi-city weather card grid
5. Error/loading/empty states

### Future Routes

These should not be required for v1.0:

1. `/forecast/:city`
2. `/settings`
3. `/favorites`

Forecast, settings, and favorites can also be added later as panels inside the dashboard before becoming separate routes.

---

## 4. Page Layout

### Desktop Layout

Use a full-width page with a constrained inner container. The layout should feel like a compact weather app dashboard rather than an admin table.

- Page max width: `1180px`
- Horizontal padding: `24px` to `32px`
- Vertical spacing between major sections: `24px`
- Weather card grid: 3 columns when space allows
- Search area should remain near the top and be easy to scan

Recommended structure:

1. Header row
2. Search row
3. Large selected city current weather panel
4. Multi-city card grid

### Tablet Layout

- Page padding: `20px`
- Weather card grid: 2 columns
- Search input remains full width or near-full width

### Mobile Layout

- Page padding: `16px`
- Weather card grid: 1 column
- Header content stacks only if required
- Search input and primary action should be easy to tap
- Minimum touch target: `44px`
- The selected weather panel appears first, followed by search/results and then the city list if vertical space is tight.

---

## 5. Visual Design Direction

The UI should feel clear, modern, practical, and lightly atmospheric. Apple Weather should be used as the style reference: large weather data, soft rounded panels, subtle depth, condition-aware colors, and a calm mobile-first rhythm.

Avoid a marketing-style hero. Avoid busy illustrations, heavy charting, and decorative gradients that make the data harder to read. Atmospheric color is allowed when it supports the weather context.

### Tone

- Calm
- Clean
- Useful
- Simple but professional
- Weather-focused
- Lightly atmospheric, but not decorative-heavy

### Color Palette

Use a balanced, non-monochrome palette. The default visual should feel close to a bright Apple Weather screen: soft sky background, white translucent cards, blue accents, and readable dark text.

Recommended base:

- Page background: `#EAF4FF`
- Surface: `#FFFFFF`
- Elevated surface: `rgba(255, 255, 255, 0.82)`
- Primary text: `#172033`
- Secondary text: `#667085`
- Border: `rgba(148, 163, 184, 0.28)`
- Primary action: `#0A84FF`
- Success/accent: `#0E9F6E`
- Warning/accent: `#F59E0B`
- Error: `#DC2626`

Condition accents may be used sparingly:

- Sunny: sky blue with warm amber highlight
- Cloudy: cool gray-blue
- Rain: deeper blue
- Storm: slate with warning accent

Recommended atmospheric backgrounds:

- Clear: `linear-gradient(180deg, #72B7FF 0%, #DDEFFF 100%)`
- Cloudy: `linear-gradient(180deg, #A7B4C7 0%, #EEF3F8 100%)`
- Rain: `linear-gradient(180deg, #4F83C2 0%, #D8E7F8 100%)`
- Night: `linear-gradient(180deg, #1E2A44 0%, #415B89 100%)`

Do not let the whole interface become only blue, only purple, or only beige.

---

## 6. Typography

Use the system font stack unless the project later adds a brand font.

Recommended stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

- Page title: `28px` desktop, `24px` mobile
- Section title: `18px` to `20px`
- Card city name: `18px`
- Large current temperature: `64px` desktop, `52px` mobile
- Card temperature: `40px` desktop, `34px` mobile
- Body text: `14px` to `16px`
- Metadata: `12px` to `13px`

Rules:

- Letter spacing should remain `0`.
- Do not scale font size with viewport width.
- Text must not overflow buttons, cards, or compact panels.

---

## 7. Components

### 7.1 App Header

Purpose: Identify the app and provide light context.

Content:

- App name: `Weather Dashboard`
- Optional subtitle: `Current conditions across your cities`

Behavior:

- No large hero treatment.
- Header should not consume excessive vertical space.

### 7.2 City Search

Purpose: Let users search and select city results.

Elements:

- Text input
- Search icon
- Clear button when input has text
- Loading indicator during search
- Results dropdown/list

Input placeholder:

`Search city`

Rules:

- Debounce search requests by `300ms`.
- Do not search when the query is empty.
- Trim query before submitting.
- Support keyboard navigation later if time allows.

Search result item should show:

- City name
- Region, if available
- Country

States:

- Empty query
- Searching
- Results found
- No results
- API/network error

### 7.3 Current Weather Panel

Purpose: Show the selected city's current weather with stronger emphasis than other cards.

Content:

- City
- Country
- Temperature in Celsius
- Weather condition
- Weather icon
- Humidity
- Wind speed
- Last updated time

Recommended layout:

- Top: city and country
- Center: large temperature and weather icon
- Below: condition, updated time, humidity, and wind metrics

Visual rules:

- Use the most Apple Weather-like treatment in the app here: large temperature, generous spacing, rounded surface, and soft atmospheric background.
- Border radius: `20px` to `28px`
- Padding: `24px` desktop, `20px` tablet, `18px` mobile
- Minimum height: `260px` desktop, `220px` mobile
- Text must remain readable over any background. Add a subtle overlay if using a condition gradient.

### 7.4 Weather Card

Purpose: Show compact current weather for each city in the multi-city list.

Content:

- City
- Country
- Temperature
- Condition
- Icon
- Humidity
- Wind speed
- Updated time
- Remove button if the city can be removed from dashboard

Card rules:

- Border radius: `16px`
- Padding: `16px`
- Use a soft white or translucent surface inspired by Apple Weather cards.
- Use subtle shadow only: `0 12px 30px rgba(15, 23, 42, 0.08)` or lighter.
- Use stable dimensions so loading text or icons do not shift layout heavily.
- Avoid nesting cards inside cards.
- Entire card may be clickable later for forecast details.

### 7.5 Multi-City Grid

Purpose: Compare weather for multiple cities.

Default cities may be:

- Bangkok
- Tokyo
- London

Rules:

- Must support at least 3 cities.
- If one city fails, show an error state for that city without breaking the full grid.
- Keep card heights visually consistent.

### 7.6 Forecast Preview - v1.1

Not required in MVP, but reserve a future section below current weather.

Content:

- 5 day rows or compact cards
- Date
- Max temperature
- Min temperature
- Average temperature
- Condition
- Chance of rain

### 7.7 Geolocation Action - v1.1

Not required in MVP.

Use a small icon button or text button near search:

Label:

`Use my location`

States:

- Permission prompt pending
- Permission denied
- Location found
- Location unavailable

---

## 8. UI States

### Initial State

Show:

- Header
- Search input
- Default multi-city cards or empty dashboard prompt

If default cities are used, load Bangkok, Tokyo, and London.

### Loading State

Use skeleton blocks for weather cards when loading multiple cities.

Rules:

- Skeleton should approximate final card layout.
- Avoid full-page spinners unless the entire app is blocked.

### Empty State

When no cities are selected:

Title:

`No cities yet`

Message:

`Search for a city to add current weather to your dashboard.`

### City Not Found

Message:

`City not found. Try another spelling or choose from the search results.`

### Network/API Error

Message:

`Weather data is unavailable right now. Please try again.`

### Partial Multi-City Failure

Inside failed card:

`Could not load this city`

Do not remove other successful city cards.

---

## 9. Interaction Rules

1. Pressing Enter in search should fetch/select the top relevant result when possible.
2. Selecting a search result adds or focuses that city.
3. Duplicate cities should not be added twice.
4. Removing a city updates the grid immediately.
5. Loading and error states should be visible near the action that caused them.
6. WeatherAPI technical errors should be translated into user-friendly copy.

---

## 10. Data Display Rules

Temperature:

- Display Celsius as `28°C`.
- Round to nearest whole number for card display.

Humidity:

- Display as `Humidity 70%`.

Wind:

- Display as `Wind 12 kph`.

Updated time:

- Display as `Updated 14:30` or `Updated May 8, 14:30`.
- Use local readable time formatting.

Missing values:

- Use `--` for unavailable numeric metrics.
- Do not render `null`, `undefined`, or raw API field names.

---

## 11. Accessibility Requirements

1. Search input must have an accessible label.
2. Icon-only buttons must include `aria-label`.
3. Weather icons must include useful alt text or be hidden if decorative.
4. Text/background contrast should meet WCAG AA.
5. Keyboard users must be able to focus search, results, add/remove actions, and retry buttons.
6. Loading states should not trap focus.
7. Error messages should be associated with the relevant input or card.

---

## 12. Responsive Requirements

Responsiveness is a **Nice-to-have** per SPEC.md but strongly recommended. The same dashboard should work cleanly on mobile, tablet, and desktop without horizontal scrolling, clipped text, overlapping cards, or unusable touch targets.

Breakpoints:

- Mobile: `<640px`
- Tablet: `640px` to `1023px`
- Desktop: `1024px+`

Grid:

- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

Current weather panel:

- Mobile: stacked content, centered temperature, metrics in a 2-column row when space allows
- Tablet: balanced stacked or two-zone layout
- Desktop: larger panel with city/details on one side and temperature/icon emphasis on the other

Search:

- Mobile: full width
- Desktop: max width around `560px`

Header:

- Mobile: stack title/subtitle if needed
- Desktop: horizontal alignment allowed

Verification targets:

- `375px` wide mobile viewport
- `768px` tablet viewport
- `1024px` small desktop viewport
- `1440px` desktop viewport

At each target, confirm:

1. No horizontal page scroll.
2. Search input remains usable.
3. Weather cards do not overlap.
4. Temperature text does not overflow.
5. Buttons remain at least `44px` tall on touch layouts.

---

## 13. Frontend Implementation Notes

Suggested component structure (Next.js App Router):

```txt
app/
├── page.tsx                    # Dashboard route (/ )
├── layout.tsx                  # Root layout
└── api/
    ├── weather/
    │   ├── current/route.ts    # GET /api/weather/current
    │   └── multiple/route.ts   # GET /api/weather/multiple
    └── cities/
        └── search/route.ts     # GET /api/cities/search

components/
├── app-header.tsx
├── city-search.tsx
├── current-weather-panel.tsx
├── weather-card.tsx
├── weather-card-skeleton.tsx
└── empty-state.tsx

hooks/
├── use-city-search.ts
└── use-weather-dashboard.ts

types/
└── weather.ts

utils/
└── format-weather.ts
```

Suggested TypeScript models:

```ts
export interface CurrentWeather {
  city: string;
  country: string;
  temperature_c: number | null;
  humidity: number | null;
  wind_kph: number | null;
  condition: string;
  icon: string;
  updated_at: string;
}

export interface CitySearchResult {
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
}

// API calls use Next.js built-in fetch — Axios is not required
```

---

## 14. Backend Contract Dependencies

The UI depends on these MVP endpoints:

```txt
GET /api/v1/health
GET /api/v1/weather/current?city=Bangkok
GET /api/v1/weather/multiple?cities=Bangkok,Tokyo,London
GET /api/v1/cities/search?q=Bangkok
```

Expected error format:

```json
{
  "ok": false,
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "City not found"
  }
}
```

The frontend must not call WeatherAPI.com directly.

---

## 15. Acceptance Checklist

The UI is acceptable for v1.0 when:

1. User can search for a city.
2. User can select a city and see current weather.
3. Dashboard can show at least three weather cards.
4. Failed city data does not break successful city cards.
5. Loading, empty, city not found, and network error states are implemented.
6. Layout works on mobile, tablet, and desktop with no overflow or overlapping content.
7. API key is not exposed to frontend code.
8. No raw API errors, `null`, or `undefined` values appear in the UI.
9. Buttons and inputs are keyboard-focusable.
10. UI follows an Apple Weather-inspired visual direction: simple, polished, responsive, readable, rounded, and weather-first.

---

## 16. Out of Scope for v1.0

Do not include these in the first version unless core MVP is already complete:

1. Authentication
2. User account management
3. Historical weather analytics
4. Weather map layer
5. Paid subscription
6. AI weather summary
7. PWA support
8. Complex charts
