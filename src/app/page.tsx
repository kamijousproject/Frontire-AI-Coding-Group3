'use client'

import { useState, useCallback } from 'react'
import { useCityStorage } from '@/hooks/useLocalStorage'
import { useWeather } from '@/hooks/useWeather'
import { SearchBar } from '@/components/SearchBar'
import { WeatherGrid } from '@/components/WeatherGrid'
import type { CityEntry } from '@/types/weather'

function coordKey(city: CityEntry): string {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`
}

export default function Home() {
  const { cities, addCity, removeCity } = useCityStorage()
  const { results, loading, retryCity } = useWeather(cities)
  const [retryExhausted, setRetryExhausted] = useState<Map<string, boolean>>(new Map())

  const handleRetry = useCallback((city: CityEntry) => {
    const key = coordKey(city)
    if (retryExhausted.get(key)) return
    retryCity(city)
    setRetryExhausted((prev) => new Map(prev).set(key, true))
  }, [retryCity, retryExhausted])

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-500">
      <header className="flex items-center justify-between bg-black/20 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white">Weather Dashboard</h1>
        <SearchBar cities={cities} onAddCity={addCity} />
      </header>
      <main className="flex flex-1 flex-col">
        <WeatherGrid
          cities={cities}
          results={results}
          loading={loading}
          retryCity={handleRetry}
          retryExhausted={retryExhausted}
          onRemoveCity={removeCity}
        />
      </main>
    </div>
  )
}
