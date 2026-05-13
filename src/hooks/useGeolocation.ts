'use client'

import { useState, useCallback } from 'react'
import type { CityEntry, ErrorResponse } from '@/types/weather'

interface GeolocationState {
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null })

  const getLocation = useCallback(async (): Promise<CityEntry | null> => {
    setState({ loading: true, error: null })

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState({ loading: false, error: 'Geolocation not supported' })
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Fetch weather for coordinates to get location info
            const res = await fetch(`/api/v1/weather/location?lat=${latitude}&lon=${longitude}`)
            if (!res.ok) {
              setState({ loading: false, error: 'Unable to fetch location data' })
              resolve(null)
              return
            }

            const data = await res.json()
            if ('error' in data) {
              setState({ loading: false, error: data.error })
              resolve(null)
              return
            }

            // Create CityEntry from response
            const cityEntry: CityEntry = {
              id: Date.now(), // Generate temporary ID
              name: data.city,
              country: data.country,
              region: data.region || null,
              lat: latitude,
              lon: longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            }

            setState({ loading: false, error: null })
            resolve(cityEntry)
          } catch {
            setState({ loading: false, error: 'Failed to get location' })
            resolve(null)
          }
        },
        (err) => {
          let errorMsg = 'Location access denied'
          if (err.code === 1) errorMsg = 'Please allow location access'
          if (err.code === 2) errorMsg = 'Location unavailable'
          if (err.code === 3) errorMsg = 'Location timeout'
          setState({ loading: false, error: errorMsg })
          resolve(null)
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    })
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return { ...state, getLocation, clearError }
}
