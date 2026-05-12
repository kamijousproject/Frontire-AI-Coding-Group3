'use client'

import type { CityEntry, WeatherData, ErrorResponse } from '@/types/weather'
import { getPageBgClass } from '@/lib/condition-backgrounds'
import { WeatherCard } from './WeatherCard'

interface WeatherGridProps {
  cities: CityEntry[]
  results: Map<string, WeatherData | ErrorResponse>
  loading: boolean
  retryCity: (city: CityEntry) => void
  retryExhausted: Map<string, boolean>
  onRemoveCity: (cityId: number) => void
}

function isWeatherData(r: WeatherData | ErrorResponse): r is WeatherData {
  return (r as WeatherData).type === 'data'
}

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

export function WeatherGrid({ cities, results, loading: _loading, retryCity, retryExhausted, onRemoveCity }: WeatherGridProps) {
  const firstCity = cities[0]
  const firstKey = firstCity ? coordKey(firstCity) : undefined
  const firstResult = firstKey ? results.get(firstKey) : undefined
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
          const key = coordKey(city)
          const result = results.get(key)
          const data = result && isWeatherData(result) ? result : null
          const error = result && !isWeatherData(result) ? (result as ErrorResponse) : null

          return (
            <WeatherCard
              key={city.id}
              data={data}
              error={error}
              city={data ? data.city : city.name}
              onRemove={() => onRemoveCity(city.id)}
              onRetry={() => retryCity(city)}
              retryExhausted={retryExhausted.get(key) ?? false}
            />
          )
        })}
      </div>
    </div>
  )
}
