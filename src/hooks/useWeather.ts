'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { WeatherData, MultiWeatherResult } from '@/types/weather'
import type { ErrorResponse } from '@/types/weather'

export function useWeather(cities: string[]) {
  const [results, setResults] = useState<Map<string, WeatherData | ErrorResponse>>(new Map())
  const [loading, setLoading] = useState(false)
  const retryCount = useRef<Map<string, number>>(new Map())

  const citiesKey = cities.join(',')

  useEffect(() => {
    if (cities.length === 0) {
      setResults(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/v1/weather/multiple?cities=${encodeURIComponent(cities.join(','))}`)
      .then((res) => res.json())
      .then((data: MultiWeatherResult[]) => {
        if (cancelled) return
        setResults((prev) => {
          const next = new Map(prev)
          for (const item of data) {
            const key = item.city.toLowerCase().trim()
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
            next.set(city, { error: 'Network error', code: 1003 })
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

  const retryCity = useCallback((city: string) => {
    const count = retryCount.current.get(city) ?? 0
    if (count >= 1) return
    retryCount.current.set(city, count + 1)

    fetch(`/api/v1/weather/current?city=${encodeURIComponent(city)}`)
      .then((res) => res.json())
      .then((data: WeatherData | ErrorResponse) => {
        setResults((prev) => new Map(prev).set(city, data))
      })
      .catch(() => {
        setResults((prev) => new Map(prev).set(city, { error: 'Network error', code: 1003 }))
      })
  }, [])

  return { results, loading, retryCity }
}
