/**
 * weatherapi.com API Client
 * Server-side only — WEATHER_API_KEY is never exposed to the client.
 * All requests have a 5-second AbortController timeout.
 */

import type { CitySearchResult, WeatherData, ForecastDay } from '../types/weather';

const BASE_URL = 'https://api.weatherapi.com/v1';
const TIMEOUT_MS = 5000;

/**
 * Read and validate the API key from environment.
 * Throws if not set — prevents silent failures at startup.
 */
function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new Error('WEATHER_API_KEY env var is not set');
  }
  return key;
}

/**
 * Normalize icon URLs from protocol-relative (//) to https://.
 * weatherapi.com returns icon paths like "//cdn.weatherapi.com/..."
 */
function normalizeIconUrl(url: string): string {
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}

/**
 * Fetch current weather for a city from weatherapi.com.
 * Maps the API response to the internal WeatherData schema.
 *
 * Error codes:
 *  1001 — city not found (HTTP 400 from weatherapi)
 *  1002 — rate limited (HTTP 403 from weatherapi)
 *  1003 — upstream unavailable (non-ok status or timeout)
 */
export async function fetchCurrentWeather(city: string): Promise<WeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${BASE_URL}/current.json?key=${getApiKey()}&q=${encodeURIComponent(city)}&aqi=no`;
    const response = await fetch(url, { signal: controller.signal });

    if (response.status === 400) {
      const err = new Error('City not found') as Error & { code: number };
      err.code = 1001;
      throw err;
    }

    if (response.status === 403) {
      const err = new Error('Upstream rate limit exceeded') as Error & {
        code: number;
      };
      err.code = 1002;
      throw err;
    }

    if (!response.ok) {
      const err = new Error('Upstream unavailable') as Error & { code: number };
      err.code = 1003;
      throw err;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await response.json();

    const data: WeatherData = {
      type: 'data',
      city: json.location.name,
      country: json.location.country,
      region: json.location.region,
      temp_c: json.current.temp_c,
      temp_f: json.current.temp_f,
      feelslike_c: json.current.feelslike_c,
      feelslike_f: json.current.feelslike_f,
      humidity: json.current.humidity,
      wind_kph: json.current.wind_kph,
      condition: json.current.condition.text,
      condition_code: json.current.condition.code,
      icon_url: normalizeIconUrl(json.current.condition.icon),
      is_day: json.current.is_day,
      last_updated: new Date().toISOString(),
    };

    return data;
  } catch (error) {
    // AbortController timeout — treat as upstream unavailable
    if (error instanceof Error && error.name === 'AbortError') {
      const err = new Error('Request timed out') as Error & { code: number };
      err.code = 1003;
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Search for cities by query string.
 * Returns up to 5 CitySearchResult entries.
 * Returns empty array on any non-ok response.
 */
export async function fetchCitySearch(q: string): Promise<CitySearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${BASE_URL}/search.json?key=${getApiKey()}&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any[] = await response.json();

    return json.slice(0, 5).map(
      (item): CitySearchResult => ({
        name: item.name,
        region: item.region,
        country: item.country,
      })
    );
  } catch {
    // Timeout or network error — return empty results
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch 5-day forecast for a city from weatherapi.com.
 * Returns days 1-5 from today (not including today).
 *
 * Error codes:
 *  1001 — city not found (HTTP 400 from weatherapi)
 *  1002 — rate limited (HTTP 403 from weatherapi)
 *  1003 — upstream unavailable (non-ok status or timeout)
 */
export async function fetchForecast(city: string): Promise<ForecastDay[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // days=6 includes today + 5 future days; we slice to get days 1-5
    const url = `${BASE_URL}/forecast.json?key=${getApiKey()}&q=${encodeURIComponent(city)}&days=6&aqi=no`;
    const response = await fetch(url, { signal: controller.signal });

    if (response.status === 400) {
      const err = new Error('City not found') as Error & { code: number };
      err.code = 1001;
      throw err;
    }

    if (response.status === 403) {
      const err = new Error('Upstream rate limit exceeded') as Error & {
        code: number;
      };
      err.code = 1002;
      throw err;
    }

    if (!response.ok) {
      const err = new Error('Upstream unavailable') as Error & { code: number };
      err.code = 1003;
      throw err;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await response.json();

    // Skip today (index 0) and take days 1-5
    const forecastDays: ForecastDay[] = json.forecast.forecastday
      .slice(1, 6)
      .map(
        (day: {
          date: string;
          day: {
            maxtemp_c: number;
            mintemp_c: number;
            maxtemp_f: number;
            mintemp_f: number;
            condition: { text: string; code: number; icon: string };
          };
        }): ForecastDay => ({
          date: day.date,
          maxtemp_c: day.day.maxtemp_c,
          mintemp_c: day.day.mintemp_c,
          maxtemp_f: day.day.maxtemp_f,
          mintemp_f: day.day.mintemp_f,
          condition: day.day.condition.text,
          condition_code: day.day.condition.code,
          icon_url: normalizeIconUrl(day.day.condition.icon),
        })
      );

    return forecastDays;
  } catch (error) {
    // AbortController timeout — treat as upstream unavailable
    if (error instanceof Error && error.name === 'AbortError') {
      const err = new Error('Request timed out') as Error & { code: number };
      err.code = 1003;
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch location data from IP address using weatherapi.com /ip.json endpoint.
 * If q is 'auto:ip', it uses the requester's IP.
 *
 * Error codes:
 *  1003 — upstream unavailable (non-ok status or timeout)
 */
export async function fetchLocationByIp(q: string = 'auto:ip'): Promise<{
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${BASE_URL}/ip.json?key=${getApiKey()}&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const err = new Error('Upstream unavailable') as Error & { code: number };
      err.code = 1003;
      throw err;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await response.json();

    return {
      city: json.city,
      country: json.country,
      region: json.region,
      lat: json.lat,
      lon: json.lon,
      timezone: json.tz_id,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const err = new Error('Request timed out') as Error & { code: number };
      err.code = 1003;
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
