# Weather Dashboard API Endpoints

Base URL: `/api/v1`

---

### problem
The goal of this project is to develop a web application that allows users to search and view weather information for multiple cities, including current weather, forecast data, and location-based weather.

### Health

GET `/api/v1/health`
- Success: `200 + {status, time}`

---

### Weather

GET `/api/v1/weather/current`
- Query: `{city}`
- Success: `200 + {city, country, temperature_c, humidity, wind_kph, condition, icon, updated_at}`

GET `/api/v1/weather/multiple`
- Query: `{cities}`
- Example: `?cities=Bangkok,Tokyo,London`
- Success: `200 + [{city, country, temperature_c, humidity, wind_kph, condition, icon, updated_at}]`

GET `/api/v1/weather/forecast`
- Query: `{city, days?}`
- Example: `?city=Bangkok&days=5`
- Success: `200 + {city, country, forecast: [{date, max_temp_c, min_temp_c, avg_temp_c, condition, icon, chance_of_rain}]}`

GET `/api/v1/weather/location`
- Query: `{lat, lon}`
- Success: `200 + {city, country, latitude, longitude, temperature_c, humidity, wind_kph, condition, icon, updated_at}`

GET `/api/v1/weather/alerts`
- Query: `{city}`
- Success: `200 + [{title, severity, description, effective_at, expires_at}]`

---

### Cities

GET `/api/v1/cities/search`
- Query: `{q}`
- Success: `200 + [{name, region, country, lat, lon}]`

---

### Favorites

GET `/api/v1/favorites`
- Header: `Authorization: Bearer <token>` optional for future user account support
- Success: `200 + [{id, city, country, created_at}]`

POST `/api/v1/favorites`
- Header: `Authorization: Bearer <token>` optional for future user account support
- Body: `{city, country?}`
- Success: `201 + {favorite}`

DELETE `/api/v1/favorites/:city`
- Header: `Authorization: Bearer <token>` optional for future user account support
- Success: `200 + {message}`

---

### Settings

GET `/api/v1/settings`
- Header: `Authorization: Bearer <token>` optional for future user account support
- Success: `200 + {unit, language, theme, default_city}`

PUT `/api/v1/settings`
- Header: `Authorization: Bearer <token>` optional for future user account support
- Body: `{unit?, language?, theme?, default_city?}`
- Success: `200 + {settings}`

---

### Auth (Won't Have — Out of scope for v1.0)

> These endpoints are **NOT required** for the MVP. Per MoSCoW section 6.5, a full user account system is excluded from the first release. Listed here for future reference only.

POST `/api/v1/auth/register`
- Body: `{email, password, name?}`
- Success: `201 + {user, token}`

POST `/api/v1/auth/login`
- Body: `{email, password}`
- Success: `200 + {user, token}`

POST `/api/v1/auth/logout`
- Header: `Authorization: Bearer <token>`
- Success: `200 + {message}`

GET `/api/v1/auth/me`
- Header: `Authorization: Bearer <token>`
- Success: `200 + {user}`

---

### AI Weather Summary - Future Feature

POST `/api/v1/weather/ai-summary`
- Body: `{city, days?}`
- Success: `200 + {city, summary, recommendation}`

---

### Error Format

All error responses should follow this format:

```json
{
  "ok": false,
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "City not found"
  }
}
```

---

### Common Error Codes

`400 INVALID_QUERY`
- Request query or body is invalid

`401 UNAUTHORIZED`
- Missing or invalid token

`404 CITY_NOT_FOUND`
- City does not exist or external API returned no result

`429 RATE_LIMITED`
- Too many requests

`502 WEATHER_API_ERROR`
- External weather API failed

`500 INTERNAL_SERVER_ERROR`
- Unexpected server error

---

### Recommended Notes

- Current weather should be cached for 5 minutes.
- Forecast should be cached for 30 minutes.
- Search input should be debounced on frontend.
- API keys must be stored in `.env`.
- Do not expose the external WeatherAPI key to the browser when using a backend proxy.
