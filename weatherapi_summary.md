# WeatherAPI.com API Documentation Summary

## Overview
WeatherAPI.com provides weather-related APIs including:
- Current weather
- Forecast weather
- Historical weather
- Future weather
- Marine weather
- Weather alerts
- Air quality
- Pollen data
- Astronomy data
- Time zone data
- Sports events
- IP lookup
- Search / Autocomplete

Base URL:

```txt
http://api.weatherapi.com/v1
```

Authentication uses an API key passed via query parameter:

```txt
key=<YOUR_API_KEY>
```

---

# Main API Endpoints

| Feature | Endpoint |
|---|---|
| Current Weather | `/current.json` |
| Forecast | `/forecast.json` |
| Search / Autocomplete | `/search.json` |
| History | `/history.json` |
| Alerts | `/alerts.json` |
| Marine | `/marine.json` |
| Future | `/future.json` |
| Timezone | `/timezone.json` |
| Sports | `/sports.json` |
| Astronomy | `/astronomy.json` |
| IP Lookup | `/ip.json` |

XML versions are also available using `.xml`.

---

# Core Request Parameters

| Parameter | Description |
|---|---|
| `key` | API key |
| `q` | Query location |
| `days` | Forecast days (1–14) |
| `dt` | Specific date |
| `hour` | Specific hour |
| `alerts` | Enable weather alerts |
| `aqi` | Enable air quality |
| `pollen` | Enable pollen data |
| `lang` | Response language |

---

# Supported `q` Location Formats

Examples:
- City name → `q=Paris`
- Latitude/Longitude → `q=48.8567,2.3508`
- US ZIP → `q=10001`
- UK Postcode → `q=SW1`
- Airport code → `q=iata:DXB`
- IP lookup → `q=auto:ip`
- METAR → `q=metar:EGLL`

---

# Current Weather API

Endpoint:

```txt
/current.json
```

Provides:
- Temperature
- Feels-like temperature
- Wind speed
- Humidity
- UV index
- Pressure
- Visibility
- Weather conditions

Example:

```txt
http://api.weatherapi.com/v1/current.json?key=API_KEY&q=London
```

---

# Forecast API

Endpoint:

```txt
/forecast.json
```

Supports:
- Up to 14-day forecast
- Hourly forecast
- Astronomy data
- Alerts
- Air quality
- Pollen

Key forecast data:
- Max/min temperature
- Rain chance
- Snow chance
- Sunrise/sunset
- Hourly weather

Example:

```txt
http://api.weatherapi.com/v1/forecast.json?key=API_KEY&q=London&days=7
```

---

# History API

Endpoint:

```txt
/history.json
```

Supports:
- Historical weather from Jan 1, 2010
- Hourly history
- Historical AQI
- Historical pollen (Enterprise)

Supports:
- `dt`
- `end_dt`
- `unixdt`

---

# Future Weather API

Endpoint:

```txt
/future.json
```

Provides:
- Future weather between 14 and 300 days ahead

---

# Marine Weather API

Endpoint:

```txt
/marine.json
```

Provides:
- Marine forecast
- Tide data
- Wave height
- Water temperature
- Swell direction

Useful for:
- Sailing
- Ocean/weather tracking

---

# Weather Alerts

Enable using:

```txt
alerts=yes
```

Alert fields:
- Headline
- Severity
- Urgency
- Event type
- Description
- Instructions

---

# Air Quality Data

Enable using:

```txt
aqi=yes
```

Returns:
- CO
- O3
- NO2
- SO2
- PM2.5
- PM10

EPA Levels:
| Value | Meaning |
|---|---|
| 1 | Good |
| 2 | Moderate |
| 3 | Unhealthy for sensitive groups |
| 4 | Unhealthy |
| 5 | Very unhealthy |
| 6 | Hazardous |

---

# Pollen Data

Enable using:

```txt
pollen=yes
```

Supported pollen:
- Hazel
- Alder
- Birch
- Oak
- Grass
- Mugwort
- Ragweed

---

# Astronomy API

Endpoint:

```txt
/astronomy.json
```

Provides:
- Sunrise
- Sunset
- Moonrise
- Moonset
- Moon phase
- Moon illumination

---

# Timezone API

Endpoint:

```txt
/timezone.json
```

Returns:
- Timezone ID
- Local time
- Epoch time

---

# Sports API

Endpoint:

```txt
/sports.json
```

Provides:
- Football
- Cricket
- Golf events

---

# Search / Autocomplete API

Endpoint:

```txt
/search.json
```

Search cities/towns by keyword.

---

# IP Lookup API

Endpoint:

```txt
/ip.json
```

Returns:
- Country
- Region
- City
- Coordinates
- Timezone

---

# Bulk Request Support

Available on:
- Pro+
- Business
- Enterprise

Allows multiple locations in one request.

---

# Weather Maps

Free map tile overlays available:
- Temperature
- Precipitation
- Pressure
- Wind speed

---

# Supported Languages

Examples:
- Thai → `lang=th`
- Japanese → `lang=ja`
- French → `lang=fr`
- Chinese → `lang=zh`

---

# Common Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 401 | 1002 | API key missing |
| 400 | 1003 | Missing `q` parameter |
| 400 | 1006 | Location not found |
| 401 | 2006 | Invalid API key |
| 403 | 2007 | Monthly quota exceeded |
| 403 | 2008 | API key disabled |
| 403 | 2009 | No access to endpoint |

---

# Recommended Use Cases

- Weather dashboards
- Mobile weather apps
- Travel systems
- Marine/sailing apps
- Agriculture systems
- Air quality monitoring
- Weather alerts
- Staffing/logistics planning
- Risk monitoring systems

---

# Notes

- JSON and XML are both supported.
- Advanced features depend on subscription tier.
- AQI, pollen, tides, and solar data are optional and disabled by default.
- Bulk requests must use HTTP POST.
