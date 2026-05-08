# Project C: Weather Dashboard — Requirements

Source: AI-Accelerated Software Development Workshop (slide 45/68)

---

## Project Description

**Project C: Weather Dashboard** is a web application that allows users to search and view real-time weather information for multiple cities simultaneously.

The application fetches live data from **weatherapi.com** (free tier: 1,000 calls/day) and displays it through a clean, responsive UI. Users can search for any city by name, view current conditions such as temperature, humidity, and wind speed, and optionally check a 5-day forecast or detect their location automatically via geolocation.

### Key Goals

- Display current weather for multiple cities at once
- Provide a fast and intuitive city search experience
- Handle external API data (JSON) and render it cleanly on the UI
- Call external API (weatherapi.com) through backend proxy (api route)

### Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (built-in) — acts as API proxy
- **External API**: weatherapi.com
- **Deployment**: Railway

### Frontend Style

- **TailwindCSS** for all styling
- **Mobile-first responsive design** — layout adapts to mobile, tablet, and desktop
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Weather cards stack vertically on mobile, grid layout on desktop
- Search bar and inputs optimized for touch on mobile
- Background changes based on weather condition (sunny, rainy, cloudy, etc.)

---

## 1. Must-have

Features required for the project to be considered complete.

- **Multi-city display** — แสดงสภาพอากาศได้หลายเมืองพร้อมกัน
- **Current weather** — แสดงสภาพอากาศปัจจุบันของเมืองที่เลือก
- **City search** — ระบบค้นหาเมืองด้วย keyword

---

## 2. Nice-to-have

Features that improve the experience but are not required.

- **5-day forecast** — พยากรณ์อากาศล่วงหน้า 5 วัน
- **Responsive design** — รองรับทุกขนาดหน้าจอ (mobile, tablet, desktop)
- **Geolocation** — ระบุพิกัดอัตโนมัติเพื่อแสดงสภาพอากาศตามตำแหน่งผู้ใช้

---

## 3. Technical Challenge

- **External API integration** — เชื่อมต่อ weatherapi.com (free tier: 1,000 calls/day)
- **JSON data processing** — จัดการและแปลง JSON response มาแสดงผลบน UI

---

## 4. Requirement Coverage

| # | Requirement                | Priority     | Covered By                                                    |
| - | -------------------------- | ------------ | ------------------------------------------------------------- |
| 1 | Multi-city display         | Must-have    | moscow.md 3.3 / SPEC `GET /api/v1/weather/multiple`         |
| 2 | Current weather            | Must-have    | moscow.md 3.1 / SPEC `GET /api/v1/weather/current`          |
| 3 | City search                | Must-have    | moscow.md 3.2 / SPEC `GET /api/v1/cities/search`            |
| 4 | 5-day forecast             | Nice-to-have | moscow.md 4.1 / SPEC `GET /api/v1/weather/forecast`         |
| 5 | Responsive design          | Nice-to-have | TailwindCSS mobile-first /`sm:` `md:` `lg:` breakpoints |
| 6 | Geolocation                | Nice-to-have | moscow.md 4.2 / SPEC `GET /api/v1/weather/location`         |
| 7 | weatherapi.com integration | Challenge    | moscow.md 3.4 / rule.md / SPEC notes                          |
| 8 | JSON data processing       | Challenge    | moscow.md 3.5 / datamodel.md weather_cache                    |

---

## 5. MVP Scope

The minimum viable product must include requirements 1, 2, 3, 7, and 8.

### MVP API Endpoints

| Method | Path                         | Description                 |
| ------ | ---------------------------- | --------------------------- |
| GET    | `/api/v1/health`           | Health check                |
| GET    | `/api/v1/weather/current`  | Current weather by city     |
| GET    | `/api/v1/weather/multiple` | Weather for multiple cities |
| GET    | `/api/v1/cities/search`    | Search cities by keyword    |

### Deployment (Railway)

| Service     | Railway Config                                          |
| ----------- | ------------------------------------------------------- |
| Next.js app | Web Service — `npm run build && npm start`              |
| Environment | `WEATHER_API_KEY` set in Railway environment variables  |

---

## 6. Out of Scope (v1.0)

Per moscow.md section 6 (Won't Have):

- User account system (login, register, password)
- Historical weather analytics
- Weather map layer
- Social sharing
- Multi-provider weather comparison
- Paid subscription
