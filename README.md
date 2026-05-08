# Project C: Weather Dashboard

**AI-Accelerated Software Development Workshop**

A web application that allows users to search and view real-time weather information for multiple cities. Data is fetched from **weatherapi.com** (free tier: 1,000 calls/day) and displayed through a clean, responsive UI.

> Part of the Frontire AI Coding project (`Frontire-AI-Coding`)

---

## Tech Stack

- **Frontend**: React + Vite, TypeScript, TailwindCSS, Axios, React Router
- **Backend**: Node.js, Express.js
- **External API**: [WeatherAPI.com](https://www.weatherapi.com)

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- WeatherAPI.com API key (free tier supported)

---

## Project Structure

```
├── frontend/       # React + Vite app
├── backend/        # Express.js API server
├── .env.example    # Environment variable template
└── README.md
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd AIFrontire
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
WEATHER_API_KEY=your_api_key_here
WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> **Never commit `.env` to version control.**

### 3. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the App

### Backend

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:3001`

### Frontend

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`

---

## API Reference

Base URL: `/api/v1`

See [`SPEC.md`](./SPEC.md) for full endpoint documentation.

### MVP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/weather/current` | Current weather by city |
| GET | `/api/v1/weather/multiple` | Weather for multiple cities |
| GET | `/api/v1/cities/search` | Search cities by keyword |

---

## Project C Requirements

See [`SPEC.md`](./SPEC.md) for full requirements and [`moscow.md`](./moscow.md) for feature prioritization.

| Category | Features |
|----------|---------|
| **Must-have** | Current weather, city search, multi-city display |
| **Nice-to-have** | 5-day forecast, responsive design, geolocation |
| **Technical challenge** | weatherapi.com integration, JSON data processing |
| **Out of scope (v1.0)** | Auth system, historical analytics, weather map |

---

## Contributing

- Use TypeScript for all new code
- Follow naming conventions in [`rule.md`](./rule.md)
- Required skills in [`skill.md`](./skill.md)
- Do not commit `.env`
