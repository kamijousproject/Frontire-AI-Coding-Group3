'use client'

import type { WeatherData, ErrorResponse } from '@/types/weather'
import { getPageBgClass } from '@/lib/condition-backgrounds'
import { WeatherCard } from './WeatherCard'

interface WeatherGridProps {
  cities: string[]
  results: Map<string, WeatherData | ErrorResponse>
  loading: boolean
  retryCity: (city: string) => void
  retryExhausted: Map<string, boolean>
  onRemoveCity: (city: string) => void
}

function isWeatherData(r: WeatherData | ErrorResponse): r is WeatherData {
  return (r as WeatherData).type === 'data'
}

export function WeatherGrid({ cities, results, loading: _loading, retryCity, retryExhausted, onRemoveCity }: WeatherGridProps) {
  const firstCity = cities[0]
  const firstResult = firstCity ? results.get(firstCity) : undefined
  const pageBg = firstResult && isWeatherData(firstResult)
    ? getPageBgClass(firstResult.condition_code, firstResult.is_day)
    : 'bg-gradient-to-b from-gray-400 to-gray-500'

  if (cities.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-gray-400 to-gray-500">
        <p className="text-lg text-white/80">Search for a city to get started</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${pageBg}`}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => {
          const result = results.get(city)
          const data = result && isWeatherData(result) ? result : null
          const error = result && !isWeatherData(result) ? (result as ErrorResponse) : null

          return (
            <WeatherCard
              key={city}
              data={data}
              error={error}
              city={data ? data.city : city}
              onRemove={() => onRemoveCity(city)}
              onRetry={() => retryCity(city)}
              retryExhausted={retryExhausted.get(city) ?? false}
            />
          )
        })}
      </div>
    </div>
  )
}
