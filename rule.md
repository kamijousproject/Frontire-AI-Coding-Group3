# Claude Code Project Rules
Project: Weather Dashboard Web Application

---

# 1. Project Goal

Develop a modern Weather Dashboard Web Application that:

- Displays weather for multiple cities
- Shows current weather conditions
- Supports city search
- Supports 5-day forecast
- Supports responsive design
- Supports geolocation
- Integrates with external weather APIs
- Provides clean and maintainable architecture

---

# 2. Primary Technology Stack

## Frontend
- React + Vite
- TailwindCSS
- Axios
- React Router

## Optional
- Zustand or Redux Toolkit
- Framer Motion
- Recharts

## Backend (Should Have — Required for API key proxy)
- Node.js
- Express.js

---

# 2.1 Environment Variables

- All API keys must be stored in `.env` file
- Never hardcode API keys in source files
- `.env` must be listed in `.gitignore`
- Provide `.env.example` with placeholder values for all required variables

### Required Variables

```env
WEATHER_API_KEY=your_api_key_here
WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

# 3. Coding Standards

## General
- Use TypeScript whenever possible
- Prefer functional components
- Use async/await
- Avoid callback hell
- Keep components small and reusable

## Naming Convention

### Variables
- camelCase

### Components
- PascalCase

### Constants
- UPPER_SNAKE_CASE

### Files
- kebab-case

---

# 4. Folder Structure

```txt
src/
├── api/          # axios instance + API call functions
├── assets/       # images, icons
├── components/   # reusable UI components (WeatherCard, SearchBar, etc.)
├── hooks/        # custom hooks (useWeather, useGeolocation)
├── layouts/      # page layout wrappers
├── pages/        # route-level components
├── services/     # business logic, data transform
├── store/        # (optional) Zustand or Redux — only if needed
├── styles/       # global CSS
├── types/        # TypeScript interfaces and types
├── utils/        # helper functions
└── main.tsx
```

---

# 5. Project C — MVP Checklist

Before submitting, verify:

- [ ] City search works with keyword input
- [ ] Current weather displays for selected city
- [ ] Multiple cities can be shown simultaneously
- [ ] weatherapi.com API key is stored in `.env` only
- [ ] Frontend does NOT call weatherapi.com directly
- [ ] Loading and error states are handled
- [ ] UI is responsive on mobile and desktop