'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'weather_cities'
const MAX_CITIES = 10

function normalize(name: string): string {
  return name.toLowerCase().trim()
}

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
      .map(normalize)
      .slice(0, MAX_CITIES)
  } catch {
    return []
  }
}

export function useCityStorage() {
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    setCities(readFromStorage())
  }, [])

  function addCity(name: string): void {
    const norm = normalize(name)
    setCities((prev) => {
      if (prev.some((c) => c === norm)) return prev
      if (prev.length >= MAX_CITIES) return prev
      const next = [...prev, norm]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function removeCity(name: string): void {
    const norm = normalize(name)
    setCities((prev) => {
      const next = prev.filter((c) => c !== norm)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { cities, addCity, removeCity }
}
