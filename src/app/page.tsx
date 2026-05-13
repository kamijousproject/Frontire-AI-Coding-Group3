'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCityStorage } from '@/hooks/useLocalStorage'
import { useWeather } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useUnitPreference } from '@/hooks/useUnitPreference'
import { SearchBar } from '@/components/SearchBar'
import { WeatherGrid } from '@/components/WeatherGrid'
import type { CityEntry, WeatherData } from '@/types/weather'

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

function getFirstValidWeather(results: Map<string, WeatherData | { error: string; code: number }>): WeatherData | null {
  for (const result of results.values()) {
    if ('type' in result && result.type === 'data') {
      return result as WeatherData
    }
  }
  return null
}

export default function Home() {
  const { cities, addCity, removeCity, reorderCities } = useCityStorage()
  const { results, forecasts, loading, retryCity, refresh } = useWeather(cities)
  const { getLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation()
  const { unit, toggleUnit, formatTemp } = useUnitPreference()
  const [retryExhausted, setRetryExhausted] = useState<Map<string, boolean>>(new Map())
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false)

  // Auto-request location on initial load if no cities saved
  useEffect(() => {
    if (cities.length === 0 && !hasRequestedLocation && typeof window !== 'undefined') {
      const checkPreviousRequest = sessionStorage.getItem('location_requested')
      if (!checkPreviousRequest) {
        setHasRequestedLocation(true)
        sessionStorage.setItem('location_requested', 'true')
        // Small delay to ensure UI is rendered first
        setTimeout(() => {
          getLocation().then((city) => {
            if (city) {
              addCity(city)
            }
          })
        }, 500)
      }
    }
  }, [cities.length, hasRequestedLocation, getLocation, addCity])

  const handleRetry = useCallback((city: CityEntry) => {
    const key = coordKey(city)
    if (retryExhausted.get(key)) return
    retryCity(city)
    setRetryExhausted((prev) => new Map(prev).set(key, true))
  }, [retryCity, retryExhausted])

  const handleGeolocation = async () => {
    clearError()
    const city = await getLocation()
    if (city) {
      addCity(city)
    }
  }

  // Get weather from first city for background
  const firstWeather = getFirstValidWeather(results)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Weather</h1>
                <p className="text-xs text-white/50">Global Forecast</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Unit Toggle */}
              <button
                onClick={toggleUnit}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/20"
                title={`Switch to ${unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
              >
                {unit === 'celsius' ? '°C' : '°F'}
              </button>

              {/* Geolocation Button */}
              <button
                onClick={handleGeolocation}
                disabled={geoLoading || cities.length >= 10}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="Use my location"
              >
                {geoLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={refresh}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                title="Refresh weather data"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>

              <div className="h-6 w-px bg-white/20" />
              
              <span className="hidden text-sm text-white/60 sm:block">
                {cities.length > 0 ? `${cities.length}/10 cities` : 'Add a city'}
              </span>
              <SearchBar cities={cities} onAddCity={addCity} />
            </div>
          </div>
          
          {/* Geolocation Error */}
          {geoError && (
            <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{geoError}</span>
                <button onClick={clearError} className="ml-auto text-xs underline hover:text-white">Dismiss</button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <WeatherGrid
              cities={cities}
              results={results}
              forecasts={forecasts}
              loading={loading}
              retryCity={handleRetry}
              retryExhausted={retryExhausted}
              onRemoveCity={removeCity}
              onReorderCities={reorderCities}
              formatTemp={formatTemp}
              firstWeather={firstWeather}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-white/5 py-4 text-center">
          <p className="text-xs text-white/40">Weather data provided by WeatherAPI.com</p>
        </footer>
      </div>
    </div>
  )
}
