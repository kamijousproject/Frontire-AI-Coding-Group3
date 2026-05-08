# Weather Dashboard Web App - Data Model

Version: 1.0.0

---

## 1. Overview

This document defines the data model for the Weather Dashboard Web Application.

The application supports:

- Current weather display
- Multi-city weather display
- City search
- 5-day forecast
- Geolocation weather
- Favorite cities
- User settings
- Weather API caching
- API request logging
- Future AI weather summary

---

## 2. users (Won't Have — Out of scope for v1.0)

> Per MoSCoW section 6.5, a full user account system is excluded from the first release. This table is defined here for future reference only. Use browser localStorage for favorites and settings during MVP.

Stores registered users for login, favorite cities, and settings.

1 - id: UUID PRIMARY KEY  
2 - name: VARCHAR(150) nullable  
3 - email: VARCHAR(255) UNIQUE NOT NULL  
4 - password_hash: VARCHAR(255) NOT NULL  
5 - status: ENUM('active', 'inactive') DEFAULT 'active'  
6 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
7 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

---

## 3. cities

Stores normalized city and location information.

1 - id: UUID PRIMARY KEY  
2 - name: VARCHAR(150) NOT NULL  
3 - region: VARCHAR(150) nullable  
4 - country: VARCHAR(150) NOT NULL  
5 - country_code: VARCHAR(10) nullable  
6 - latitude: DECIMAL(10,7) nullable  
7 - longitude: DECIMAL(10,7) nullable  
8 - timezone: VARCHAR(100) nullable  
9 - external_location_id: VARCHAR(150) nullable  
10 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
11 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

Recommended unique key:

1 - UNIQUE(name, region, country)

---

## 4. favorite_cities

Stores cities saved by each user.

1 - id: UUID PRIMARY KEY  
2 - user_id: UUID FOREIGN KEY → users(id)  
3 - city_id: UUID FOREIGN KEY → cities(id)  
4 - display_order: INT DEFAULT 0  
5 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

Recommended unique key:

1 - UNIQUE(user_id, city_id)

---

## 5. user_settings

Stores user weather dashboard preferences.

1 - id: UUID PRIMARY KEY  
2 - user_id: UUID FOREIGN KEY → users(id) UNIQUE  
3 - unit: ENUM('celsius', 'fahrenheit') DEFAULT 'celsius'  
4 - language: VARCHAR(10) DEFAULT 'en'  
5 - theme: ENUM('light', 'dark', 'system') DEFAULT 'system'  
6 - default_city_id: UUID FOREIGN KEY → cities(id) nullable  
7 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
8 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

---

## 6. weather_cache

Stores cached weather API responses to reduce external API calls.

1 - id: UUID PRIMARY KEY  
2 - cache_key: VARCHAR(255) UNIQUE NOT NULL  
3 - city_id: UUID FOREIGN KEY → cities(id) nullable  
4 - request_type: ENUM('current', 'forecast', 'location', 'alerts') NOT NULL  
5 - query_text: VARCHAR(255) nullable  
6 - response_json: JSON NOT NULL  
7 - expires_at: DATETIME NOT NULL  
8 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
9 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

Example cache keys:

1 - current:city:bangkok-thailand  
2 - forecast:city:bangkok-thailand:days:5  
3 - location:lat:13.7563:lon:100.5018  
4 - alerts:city:bangkok-thailand  

Recommended indexes:

1 - INDEX(cache_key)  
2 - INDEX(expires_at)  
3 - INDEX(city_id, request_type)  

---

## 7. search_history (Extra — Not in Requirements)

> This table is not defined in the MoSCoW requirements. It is an optional enhancement for analytics or UX improvements. Do not implement for MVP unless explicitly added to the requirements.

Stores user or anonymous city search history.

1 - id: UUID PRIMARY KEY  
2 - user_id: UUID FOREIGN KEY → users(id) nullable  
3 - session_id: VARCHAR(150) nullable  
4 - city_id: UUID FOREIGN KEY → cities(id) nullable  
5 - query_text: VARCHAR(255) NOT NULL  
6 - result_count: INT DEFAULT 0  
7 - searched_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

Recommended indexes:

1 - INDEX(user_id)  
2 - INDEX(session_id)  
3 - INDEX(searched_at)  

---

## 8. weather_alerts

Stores weather alert snapshots from the external weather API.

1 - id: UUID PRIMARY KEY  
2 - city_id: UUID FOREIGN KEY → cities(id)  
3 - external_alert_id: VARCHAR(150) nullable  
4 - title: VARCHAR(255) NOT NULL  
5 - severity: ENUM('minor', 'moderate', 'severe', 'extreme') nullable  
6 - description: TEXT nullable  
7 - effective_at: DATETIME nullable  
8 - expires_at: DATETIME nullable  
9 - source: VARCHAR(150) nullable  
10 - raw_json: JSON nullable  
11 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

Recommended indexes:

1 - INDEX(city_id)  
2 - INDEX(effective_at)  
3 - INDEX(expires_at)  

---

## 9. api_request_logs

Stores API request logs for monitoring and debugging.

1 - id: UUID PRIMARY KEY  
2 - user_id: UUID FOREIGN KEY → users(id) nullable  
3 - method: VARCHAR(10) NOT NULL  
4 - path: VARCHAR(255) NOT NULL  
5 - query_json: JSON nullable  
6 - status_code: INT NOT NULL  
7 - response_time_ms: INT nullable  
8 - ip_address: VARCHAR(45) nullable  
9 - user_agent: VARCHAR(500) nullable  
10 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

Recommended indexes:

1 - INDEX(user_id)  
2 - INDEX(path)  
3 - INDEX(created_at)  
4 - INDEX(status_code)  

---

## 10. ai_weather_summaries

Stores future AI-generated weather summaries.

1 - id: UUID PRIMARY KEY  
2 - user_id: UUID FOREIGN KEY → users(id) nullable  
3 - city_id: UUID FOREIGN KEY → cities(id)  
4 - summary_type: ENUM('daily', 'forecast', 'travel_advice') DEFAULT 'daily'  
5 - input_json: JSON NOT NULL  
6 - summary_text: TEXT NOT NULL  
7 - model_name: VARCHAR(100) nullable  
8 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

Recommended indexes:

1 - INDEX(user_id)  
2 - INDEX(city_id)  
3 - INDEX(created_at)  

---

## 11. MVP Recommended Tables

For the first version, use only these tables:

### cities

1 - id: UUID PRIMARY KEY  
2 - name: VARCHAR(150) NOT NULL  
3 - region: VARCHAR(150) nullable  
4 - country: VARCHAR(150) NOT NULL  
5 - country_code: VARCHAR(10) nullable  
6 - latitude: DECIMAL(10,7) nullable  
7 - longitude: DECIMAL(10,7) nullable  
8 - timezone: VARCHAR(100) nullable  
9 - external_location_id: VARCHAR(150) nullable  
10 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
11 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

### weather_cache

1 - id: UUID PRIMARY KEY  
2 - cache_key: VARCHAR(255) UNIQUE NOT NULL  
3 - city_id: UUID FOREIGN KEY → cities(id) nullable  
4 - request_type: ENUM('current', 'forecast', 'location') NOT NULL  
5 - query_text: VARCHAR(255) nullable  
6 - response_json: JSON NOT NULL  
7 - expires_at: DATETIME NOT NULL  
8 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  
9 - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  

### api_request_logs

1 - id: UUID PRIMARY KEY  
2 - method: VARCHAR(10) NOT NULL  
3 - path: VARCHAR(255) NOT NULL  
4 - query_json: JSON nullable  
5 - status_code: INT NOT NULL  
6 - response_time_ms: INT nullable  
7 - ip_address: VARCHAR(45) nullable  
8 - user_agent: VARCHAR(500) nullable  
9 - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP  

---

## 12. Entity Relationship Summary

1 - users → favorite_cities: one-to-many  
2 - users → user_settings: one-to-one  
3 - users → search_history: one-to-many  
4 - users → api_request_logs: one-to-many nullable  
5 - users → ai_weather_summaries: one-to-many nullable  
6 - cities → favorite_cities: one-to-many  
7 - cities → weather_cache: one-to-many nullable  
8 - cities → search_history: one-to-many nullable  
9 - cities → weather_alerts: one-to-many  
10 - cities → ai_weather_summaries: one-to-many  

---

## 13. API to Data Model Mapping

### Weather

GET `/api/v1/weather/current`
- Uses: cities, weather_cache, api_request_logs

GET `/api/v1/weather/multiple`
- Uses: cities, weather_cache, api_request_logs

GET `/api/v1/weather/forecast`
- Uses: cities, weather_cache, api_request_logs

GET `/api/v1/weather/location`
- Uses: cities, weather_cache, api_request_logs

GET `/api/v1/weather/alerts`
- Uses: cities, weather_alerts, weather_cache, api_request_logs

---

### Cities

GET `/api/v1/cities/search`
- Uses: cities, search_history, api_request_logs

---

### Favorites

GET `/api/v1/favorites`
- Uses: users, favorite_cities, cities, api_request_logs

POST `/api/v1/favorites`
- Uses: users, favorite_cities, cities, api_request_logs

DELETE `/api/v1/favorites/:city`
- Uses: users, favorite_cities, cities, api_request_logs

---

### Settings

GET `/api/v1/settings`
- Uses: users, user_settings, cities, api_request_logs

PUT `/api/v1/settings`
- Uses: users, user_settings, cities, api_request_logs

---

### Auth (Won't Have — Out of scope for v1.0)

> These endpoints are NOT required for the MVP. Per MoSCoW section 6.5, the full user account system is excluded from the first release.

POST `/api/v1/auth/register`
- Uses: users, user_settings, api_request_logs

POST `/api/v1/auth/login`
- Uses: users, api_request_logs

POST `/api/v1/auth/logout`
- Uses: users, api_request_logs

GET `/api/v1/auth/me`
- Uses: users, api_request_logs

---

### Future AI Feature

POST `/api/v1/weather/ai-summary`
- Uses: users, cities, weather_cache, ai_weather_summaries, api_request_logs

---

## 14. Recommended Development Approach

1 - Start with cities, weather_cache, and api_request_logs.  
2 - Use browser localStorage for favorite cities and settings during MVP.  
3 - Add users, favorite_cities, and user_settings when login is required.  
4 - Add weather_alerts only when weather warning feature is implemented.  
5 - Add ai_weather_summaries only when AI summary feature is implemented.  

---

## 15. Alternative Simple MVP

For a small demo project, the backend database can be limited to:

1 - cities  
2 - weather_cache  
3 - api_request_logs  

Favorite cities and settings can be stored in browser localStorage.

This approach is faster to build and still meets the main project requirements.
