'use client'

import { useState, useRef, useEffect } from 'react'
import type { CityEntry } from '@/types/weather'

interface SearchBarProps {
  cities: CityEntry[]
  onAddCity: (city: CityEntry) => void
}

export function SearchBar({ cities, onAddCity }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CityEntry[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [duplicateError, setDuplicateError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setDuplicateError(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/cities/search?q=${encodeURIComponent(val)}`)
        if (res.ok) {
          const data: CityEntry[] = await res.json()
          setResults(data)
          setShowDropdown(true)
        }
      } catch {
        // silent — search is non-critical
      }
    }, 300)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') setShowDropdown(false)
  }

  function handleSelect(result: CityEntry) {
    if (cities.length >= 10) return
    if (cities.some((c) => c.id === result.id)) {
      setDuplicateError(true)
      if (dupTimerRef.current) clearTimeout(dupTimerRef.current)
      dupTimerRef.current = setTimeout(() => setDuplicateError(false), 3000)
      return
    }
    onAddCity(result)
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  const isFull = cities.length >= 10

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search for a city..."
        className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      {duplicateError && (
        <p className="mt-1 text-sm text-red-300">City already added</p>
      )}

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm">
          {results.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-500">No cities found</li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={isFull}
                  title={isFull ? 'City list full (10/10)' : undefined}
                  onClick={() => handleSelect(r)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {r.name}{r.region ? `, ${r.region}` : ''}, {r.country}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
