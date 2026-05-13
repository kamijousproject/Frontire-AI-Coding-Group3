'use client'

import { useState } from 'react'
import type { WeatherData, ErrorResponse, CityEntry, ForecastDay } from '@/types/weather'
import { getCardBgClass } from '@/lib/condition-backgrounds'

interface WeatherCardProps {
  data: WeatherData | null
  error: ErrorResponse | null
  forecast?: ForecastDay[]
  city: CityEntry
  onRemove: () => void
  onRetry: () => void
  retryExhausted: boolean
  formatTemp: (celsius: number, fahrenheit: number) => string
}

function formatDay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString([], { weekday: 'short' })
}

function getCardGradient(conditionCode: number, isDay: number): string {
  // Sunny
  if (conditionCode === 1000) {
    return isDay === 1 
      ? 'from-orange-400/20 via-amber-400/20 to-yellow-400/20'
      : 'from-indigo-600/20 via-purple-600/20 to-blue-800/20'
  }
  // Partly cloudy
  if (conditionCode === 1003) {
    return isDay === 1
      ? 'from-blue-400/20 via-sky-300/20 to-slate-300/20'
      : 'from-slate-700/20 via-blue-800/20 to-indigo-900/20'
  }
  // Cloudy
  if ([1006, 1007, 1008, 1009].includes(conditionCode)) {
    return 'from-gray-400/20 via-slate-400/20 to-zinc-500/20'
  }
  // Rain
  if (conditionCode === 1063 || (conditionCode >= 1150 && conditionCode <= 1201) || (conditionCode >= 1240 && conditionCode <= 1246)) {
    return 'from-blue-700/30 via-slate-700/30 to-gray-800/30'
  }
  // Snow
  if (conditionCode === 1066 || (conditionCode >= 1114 && conditionCode <= 1117) || (conditionCode >= 1210 && conditionCode <= 1237)) {
    return 'from-blue-100/20 via-slate-200/20 to-white/20'
  }
  // Thunder
  if (conditionCode === 1087 || (conditionCode >= 1273 && conditionCode <= 1282)) {
    return 'from-purple-800/30 via-indigo-900/30 to-slate-900/30'
  }
  // Default
  return 'from-white/10 via-white/5 to-white/10'
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WeatherCard({ data, error, forecast, city, onRemove, onRetry, retryExhausted, formatTemp }: WeatherCardProps) {
  const [showForecast, setShowForecast] = useState(false)
  const gradient = data ? getCardGradient(data.condition_code, data.is_day) : 'from-white/10 via-white/5 to-white/10'
  const cardBg = data ? getCardBgClass(data.condition_code, data.is_day) : 'bg-white/5'

  // Loading state
  if (!data && !error) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} ${cardBg} p-6 backdrop-blur-xl transition-all duration-300`}>
        <div className="flex h-48 flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/20 border-t-white" />
          <p className="text-sm text-white/60">Loading weather...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !retryExhausted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-500/10 to-red-900/10 p-6 backdrop-blur-xl">
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex h-48 flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-center text-sm text-red-200">{error.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Retry exhausted
  if (error && retryExhausted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-white/50">Unable to load</p>
          <p className="text-xs text-white/30">{city.name}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (!data) return null

  const isDay = data.is_day === 1

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} ${cardBg} p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20`}>
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      
      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/60 opacity-0 transition-all hover:bg-black/40 hover:text-white group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="relative mb-4">
        <h3 className="text-xl font-bold text-white">{city.name}</h3>
        <p className="text-sm text-white/60">{data.country}</p>
        <p className="mt-1 text-xs text-white/40">{formatTime(data.last_updated)}</p>
      </div>

      {/* Main weather display */}
      <div className="relative flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-5xl font-bold tracking-tight text-white">
            {formatTemp(data.temp_c, data.temp_f)}
          </span>
          <span className="text-sm text-white/60">{data.condition}</span>
        </div>
        <img 
          src={data.icon_url} 
          alt={data.condition} 
          className="h-20 w-20 drop-shadow-lg"
        />
      </div>

      {/* Stats grid */}
      <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-xl bg-black/20 p-3">
        <div className="text-center">
          <p className="text-xs text-white/50">Feels</p>
          <p className="text-sm font-semibold text-white">{formatTemp(data.feelslike_c, data.feelslike_f)}</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-xs text-white/50">Wind</p>
          <p className="text-sm font-semibold text-white">{Math.round(data.wind_kph)} <span className="text-xs font-normal">km/h</span></p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/50">Humidity</p>
          <p className="text-sm font-semibold text-white">{data.humidity}<span className="text-xs font-normal">%</span></p>
        </div>
      </div>

      {/* Forecast Toggle */}
      {forecast && forecast.length > 0 && (
        <button
          onClick={() => setShowForecast(!showForecast)}
          className="relative mt-3 flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/10"
        >
          <span>5-Day Forecast</span>
          <svg 
            className={`h-4 w-4 transition-transform ${showForecast ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Forecast Display */}
      {showForecast && forecast && forecast.length > 0 && (
        <div className="relative mt-2 space-y-2 rounded-xl bg-black/20 p-3">
          {forecast.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="w-10 text-xs font-medium text-white/70">{formatDay(day.date)}</span>
              <img src={day.icon_url} alt={day.condition} className="h-6 w-6" />
              <div className="flex gap-2 text-xs">
                <span className="text-white/90">{formatTemp(day.maxtemp_c, day.maxtemp_f)}</span>
                <span className="text-white/50">{formatTemp(day.mintemp_c, day.mintemp_f)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day/Night indicator */}
      <div className="relative mt-3 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isDay ? 'bg-yellow-400' : 'bg-indigo-400'}`} />
        <span className="text-xs text-white/50">{isDay ? 'Daytime' : 'Nighttime'}</span>
      </div>
    </div>
  )
}
