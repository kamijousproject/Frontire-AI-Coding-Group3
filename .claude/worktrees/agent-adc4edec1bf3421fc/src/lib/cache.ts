/**
 * Server-Side Cache
 * In-memory LRU-style cache for WeatherData with 10-minute TTL.
 * Keys are normalized to lowercase + trim for case-insensitive city lookup.
 */

import type { WeatherData } from '../types/weather';

const TTL_MS = 600_000; // 10 minutes

interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

function normalizeKey(city: string): string {
  return city.toLowerCase().trim();
}

/**
 * Retrieve cached WeatherData for a city.
 * Returns null if not cached or if the entry has expired.
 */
export function get(city: string): WeatherData | null {
  const key = normalizeKey(city);
  const entry = store.get(key);

  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store WeatherData for a city with 10-minute TTL.
 */
export function set(city: string, data: WeatherData): void {
  const key = normalizeKey(city);
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}
