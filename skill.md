# AI Skills & Engineering Skills
Project: Weather Dashboard

---

# 1. Required AI Skills

## AI-Assisted Coding
Team members should know how to:

- Generate boilerplate code
- Generate UI components
- Generate API integration code
- Debug using AI
- Refactor using AI
- Ask structured prompts

---

# 2. Prompt Engineering Skills

Developers should be able to write prompts like:

## Example
```txt
Create a reusable React weather card component using TailwindCSS.
Support loading state and responsive layout.
Use TypeScript.
```

## Good Prompt Principles
- Be specific about the technology (React, TailwindCSS, TypeScript)
- Describe the input props and expected output
- Mention edge cases (loading, error, empty state)
- Ask for one component at a time

---

# 3. Frontend Engineering Skills

## React
- Functional components with hooks
- Custom hooks for API calls (`useWeather`, `useGeolocation`)
- Custom hooks for future features (`useFavorites` — Should Have v1.1+)
- Component composition and reuse
- State management with useState / useReducer

## TypeScript
- Define interfaces for API responses
- Type props and return values
- Avoid using `any`

## TailwindCSS
- Responsive utilities (`sm:`, `md:`, `lg:`) — required for MVP
- Conditional classes with `clsx` or `cn`
- Dark mode support (`dark:`) — Could Have, implement after MVP

## Axios
- Create axios instance with base URL
- Handle request/response interceptors
- Handle errors from backend API

---

# 4. Backend Engineering Skills

## Node.js + Express
- Create REST API routes
- Use middleware for error handling
- Handle async errors with try/catch or wrapper
- Set up CORS for frontend access

## Environment Variables
- Load `.env` with `dotenv`
- Never expose API keys to client
- Use `.env.example` as reference template

## External API Integration
- Call WeatherAPI.com from backend only (never from frontend)
- Map external response to internal format
- Handle 4xx/5xx from external API
- WeatherAPI.com free tier limit: 1,000 calls/day — use caching to preserve quota

---

# 5. General Skills

## Git
- Commit with clear messages
- Use feature branches
- Do not commit `.env`

## Code Quality
- Write small, focused functions
- Avoid deep nesting
- Prefer named exports

## Debugging
- Use browser DevTools for frontend
- Use console.log or a logger for backend
- Inspect network requests in browser