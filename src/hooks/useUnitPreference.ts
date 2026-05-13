'use client'

import { useState, useEffect } from 'react'

type TemperatureUnit = 'celsius' | 'fahrenheit'

const STORAGE_KEY = 'weather_unit_preference'

export function useUnitPreference() {
  const [unit, setUnit] = useState<TemperatureUnit>('celsius')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY) as TemperatureUnit | null
    if (saved === 'celsius' || saved === 'fahrenheit') {
      setUnit(saved)
    }
  }, [])

  const toggleUnit = () => {
    const newUnit = unit === 'celsius' ? 'fahrenheit' : 'celsius'
    setUnit(newUnit)
    localStorage.setItem(STORAGE_KEY, newUnit)
  }

  const setUnitPreference = (newUnit: TemperatureUnit) => {
    setUnit(newUnit)
    localStorage.setItem(STORAGE_KEY, newUnit)
  }

  // Format temperature based on preference
  const formatTemp = (celsius: number, fahrenheit: number): string => {
    if (!mounted) return `${Math.round(celsius)}°C` // Default for SSR
    return unit === 'celsius' 
      ? `${Math.round(celsius)}°C` 
      : `${Math.round(fahrenheit)}°F`
  }

  return { unit, toggleUnit, setUnitPreference, formatTemp, mounted }
}
