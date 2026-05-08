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

## Backend (Optional)
- Node.js
- Express.js

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
├── api/
├── assets/
├── components/
├── hooks/
├── layouts/
├── pages/
├── services/
├── store/
├── styles/
├── types/
├── utils/
└── main.tsx