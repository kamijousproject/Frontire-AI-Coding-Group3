'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CityEntry, WeatherData, MultiWeatherResult, ErrorResponse } from '@/types/weather'

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

export function useWeather(cities: CityEntry[]) {
  const [results, setResults] = useState<Map<string, WeatherData | ErrorResponse>>(new Map())
  const [loading, setLoading] = useState(false)
  const retryCount = useRef<Map<string, number>>(new Map())

  // Stable dependency key — changes only when city list IDs change
  const citiesKey = cities.map((c) => c.id).join(',')

  useEffect(() => {
    if (cities.length === 0) {
      setResults(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    // Build pipe/colon query: lat:lon|lat:lon
    const citiesParam = cities
      .map((c) => `${c.lat.toFixed(4)}:${c.lon.toFixed(4)}`)
      .join('|')

    fetch(`/api/v1/weather/multiple?cities=${encodeURIComponent(citiesParam)}`)
      .then((res) => res.json())
      .then((data: MultiWeatherResult[]) => {
        if (cancelled) return
        setResults((prev) => {
          const next = new Map(prev)
          for (const item of data) {
            // item.city is the coordinate string e.g. "13.7500,100.5170" from the server
            const key = item.city
            if (item.type === 'data') {
              next.set(key, item)
            } else {
              next.set(key, { error: item.error, code: item.code })
            }
          }
          return next
        })
      })
      .catch(() => {
        if (cancelled) return
        setResults((prev) => {
          const next = new Map(prev)
          for (const city of cities) {
            next.set(coordKey(city), { error: 'Network error', code: 1003 })
          }
          return next
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesKey])

  const retryCity = useCallback((city: CityEntry) => {
    const key = coordKey(city)
    const count = retryCount.current.get(key) ?? 0
    if (count >= 1) return
    retryCount.current.set(key, count + 1)

    fetch(`/api/v1/weather/current?q=${encodeURIComponent(coordKey(city))}`)
      .then((res) => res.json())
      .then((data: WeatherData | ErrorResponse) => {
        setResults((prev) => new Map(prev).set(key, data))
      })
      .catch(() => {
        setResults((prev) => new Map(prev).set(key, { error: 'Network error', code: 1003 }))
      })
  }, [])

  return { results, loading, retryCity }
}
