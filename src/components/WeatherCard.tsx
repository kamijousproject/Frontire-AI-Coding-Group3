'use client'

import type { WeatherData, ErrorResponse } from '@/types/weather'
import { getCardBgClass } from '@/lib/condition-backgrounds'

interface WeatherCardProps {
  data: WeatherData | null
  error: ErrorResponse | null
  city: string
  onRemove: () => void
  onRetry: () => void
  retryExhausted: boolean
}

export function WeatherCard({ data, error, city, onRemove, onRetry, retryExhausted }: WeatherCardProps) {
  const cardBg = data ? getCardBgClass(data.condition_code, data.is_day) : 'bg-white/10'

  return (
    <div className={`relative rounded-xl p-4 text-white shadow-md ${cardBg} backdrop-blur-sm`}>
      <button
        type="button"
        aria-label="Remove city"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs hover:bg-white/40"
      >
        ×
      </button>

      {!data && !error && (
        <div className="flex h-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {data && (
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-tight">{data.city}</p>
          <p className="text-xs text-white/70">{data.country}</p>
          <div className="flex items-center gap-2 py-1">
            <img src={data.icon_url} alt={data.condition} width={64} height={64} />
            <p className="text-sm">{data.condition}</p>
          </div>
          <p className="text-2xl font-bold">{data.temp_c}°C / {data.temp_f}°F</p>
          <p className="text-xs text-white/80">Feels like {data.feelslike_c}°C / {data.feelslike_f}°F</p>
          <div className="flex gap-4 text-xs text-white/70">
            <span>{data.humidity}% humidity</span>
            <span>{data.wind_kph} km/h wind</span>
          </div>
        </div>
      )}

      {error && !retryExhausted && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm text-white/80">{error.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
          >
            Retry
          </button>
        </div>
      )}

      {error && retryExhausted && (
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-white/70">Unable to load weather data</p>
        </div>
      )}
    </div>
  )
}
