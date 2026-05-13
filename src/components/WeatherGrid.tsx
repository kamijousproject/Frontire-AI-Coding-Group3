'use client'

import { useState, useCallback } from 'react'
import type { CityEntry, WeatherData, ErrorResponse, ForecastDay } from '@/types/weather'
import { WeatherCard } from './WeatherCard'

interface WeatherGridProps {
  cities: CityEntry[]
  results: Map<string, WeatherData | ErrorResponse>
  forecasts: Map<string, ForecastDay[]>
  loading: boolean
  retryCity: (city: CityEntry) => void
  retryExhausted: Map<string, boolean>
  onRemoveCity: (cityId: number) => void
  onReorderCities: (newOrder: CityEntry[]) => void
  formatTemp: (celsius: number, fahrenheit: number) => string
  firstWeather: WeatherData | null
}

function isWeatherData(r: WeatherData | ErrorResponse): r is WeatherData {
  return (r as WeatherData).type === 'data'
}

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

export function WeatherGrid({ cities, results, forecasts, loading, retryCity, retryExhausted, onRemoveCity, onReorderCities, formatTemp }: WeatherGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCities = [...cities]
    const draggedCity = newCities[draggedIndex]
    newCities.splice(draggedIndex, 1)
    newCities.splice(index, 0, draggedCity)
    
    onReorderCities(newCities)
    setDraggedIndex(index)
  }, [draggedIndex, cities, onReorderCities])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])
  // Empty state
  if (cities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <svg className="h-12 w-12 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-white">No cities added</h2>
        <p className="max-w-md text-white/60">Search for a city above to see the weather. You can add up to 10 cities to track.</p>
        <div className="mt-8 flex gap-4 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Real-time updates</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>10 min cache</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Cities</h2>
          <p className="text-sm text-white/50">
            {cities.length} of 10 cities • Last updated {new Date().toLocaleTimeString()}
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.map((city, index) => {
          const key = coordKey(city)
          const result = results.get(key)
          const data = result && isWeatherData(result) ? result : null
          const error = result && !isWeatherData(result) ? (result as ErrorResponse) : null
          const forecast = forecasts.get(key)

          return (
            <div
              key={city.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
            >
              <WeatherCard
                data={data}
                error={error}
                forecast={forecast}
                city={city}
                onRemove={() => onRemoveCity(city.id)}
                onRetry={() => retryCity(city)}
                retryExhausted={retryExhausted.get(key) ?? false}
                formatTemp={formatTemp}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
