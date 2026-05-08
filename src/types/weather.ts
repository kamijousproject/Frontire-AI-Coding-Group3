/**
 * Weather Dashboard — Shared TypeScript Interfaces
 * Source: SPEC.md §4 — Data Models
 */

export interface WeatherData {
  type: 'data'; // explicit discriminant for MultiWeatherResult
  city: string; // e.g. "London" — raw value from weatherapi.com location.name
  country: string; // e.g. "United Kingdom" — raw from weatherapi.com, not abbreviated
  region: string; // e.g. "City of London, Greater London"
  temp_c: number; // e.g. 18.5
  temp_f: number; // e.g. 65.3
  feelslike_c: number;
  feelslike_f: number;
  humidity: number; // 0–100 (%)
  wind_kph: number;
  condition: string; // e.g. "Partly cloudy"
  condition_code: number; // weatherapi.com condition code
  icon_url: string; // always https://
  is_day: number; // 1 = day, 0 = night
  last_updated: string; // ISO 8601 UTC e.g. "2026-05-08T10:00:00Z"
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD
  maxtemp_c: number;
  mintemp_c: number;
  maxtemp_f: number;
  mintemp_f: number;
  condition: string;
  condition_code: number;
  icon_url: string; // always https://, day variant always used for forecast
}

export interface CitySearchResult {
  name: string;
  region: string;
  country: string;
}

export interface ErrorResponse {
  error: string;
  code: number;
}

export interface WeatherError {
  type: 'error'; // explicit discriminant for MultiWeatherResult
  city: string;
  error: string;
  code: number;
}

export type MultiWeatherResult = WeatherData | WeatherError;

export const APP_ERROR_CODES = {
  1001: 'CITY_NOT_FOUND',
  1002: 'RATE_LIMIT_EXCEEDED',
  1003: 'UPSTREAM_UNAVAILABLE',
  1004: 'INVALID_PARAM',
  1005: 'MAX_CITIES_EXCEEDED',
} as const;
