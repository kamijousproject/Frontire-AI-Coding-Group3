'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CityEntry, WeatherData, MultiWeatherResult, ErrorResponse, ForecastDay } from '@/types/weather'

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

export function useWeather(cities: CityEntry[]) {
  const [results, setResults] = useState<Map<string, WeatherData | ErrorResponse>>(new Map())
  const [forecasts, setForecasts] = useState<Map<string, ForecastDay[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const retryCount = useRef<Map<string, number>>(new Map())

  // Stable dependency key — changes only when city list IDs change
  const citiesKey = cities.map((c) => c.id).join(',')

  const fetchWeather = useCallback(() => {
    if (cities.length === 0) {
      setResults(new Map())
      setForecasts(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    // Build pipe/colon query: lat:lon|lat:lon
    const citiesParam = cities
      .map((c) => `${c.lat.toFixed(4)}:${c.lon.toFixed(4)}`)
      .join('|')

    // Fetch current weather
    fetch(`/api/v1/weather/multiple?cities=${encodeURIComponent(citiesParam)}`)
      .then((res) => res.json())
      .then((data: MultiWeatherResult[]) => {
        if (cancelled) return
        setResults((prev) => {
          const next = new Map(prev)
          for (const item of data) {
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

    // Fetch forecasts for each city
    cities.forEach((city) => {
      const key = coordKey(city)
      fetch(`/api/v1/weather/forecast?q=${encodeURIComponent(key)}`)
        .then((res) => res.json())
        .then((data: ForecastDay[] | ErrorResponse) => {
          if (cancelled) return
          if (Array.isArray(data)) {
            setForecasts((prev) => new Map(prev).set(key, data))
          }
        })
        .catch(() => {
          // Silently fail for forecast
        })
    })

    return () => { cancelled = true }
  }, [cities])

  useEffect(() => {
    const cleanup = fetchWeather()
    return cleanup
  }, [citiesKey, refreshKey, fetchWeather])

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

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return { results, forecasts, loading, retryCity, refresh }
}
