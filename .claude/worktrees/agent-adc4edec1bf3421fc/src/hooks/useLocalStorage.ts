'use client'

import { useState, useEffect } from 'react'
import type { CityEntry } from '@/types/weather'

const STORAGE_KEY = 'weather_cities_v2'
const MAX_CITIES = 10

function isCityEntry(value: unknown): value is CityEntry {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.country === 'string' &&
    (v.region === null || typeof v.region === 'string') &&
    typeof v.lat === 'number' &&
    typeof v.lon === 'number' &&
    typeof v.timezone === 'string'
  )
}

function readFromStorage(): CityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validate each item shape — silently drop malformed entries rather than failing entire list
    const valid = parsed.filter(isCityEntry).slice(0, MAX_CITIES)
    return valid
  } catch {
    return []
  }
}

export function useCityStorage() {
  const [cities, setCities] = useState<CityEntry[]>([])

  useEffect(() => {
    setCities(readFromStorage())
  }, [])

  function addCity(city: CityEntry): void {
    setCities((prev) => {
      if (prev.some((c) => c.id === city.id)) return prev
      if (prev.length >= MAX_CITIES) return prev
      const next = [...prev, city]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function removeCity(cityId: number): void {
    setCities((prev) => {
      const next = prev.filter((c) => c.id !== cityId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { cities, addCity, removeCity }
}
