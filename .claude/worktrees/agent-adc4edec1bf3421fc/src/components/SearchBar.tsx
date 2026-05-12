'use client'

import { useState, useRef, useEffect, useId } from 'react'
import type { CityEntry } from '@/types/weather'

interface SearchBarProps {
  cities: CityEntry[]
  onAddCity: (city: CityEntry) => void
}

function HighlightMatch({ text, query }: { text: string; query: string }): React.ReactNode {
  if (!query || !text.toLowerCase().startsWith(query.toLowerCase())) {
    return <>{text}</>
  }
  const prefix = text.slice(0, query.length)
  const rest = text.slice(query.length)
  return (
    <>
      <strong>{prefix}</strong>
      {rest}
    </>
  )
}

function formatSuggestion(city: CityEntry, query: string): React.ReactNode {
  const suffix = city.region ? `, ${city.region}, ${city.country}` : `, ${city.country}`
  // HighlightMatch wraps only the city name — region and country remain plain text
  return (
    <>
      <HighlightMatch text={city.name} query={query} />
      {suffix}
    </>
  )
}

export function SearchBar({ cities, onAddCity }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CityEntry[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [duplicateError, setDuplicateError] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const listboxId = useId()
  const getOptionId = (i: number) => `${listboxId}-opt-${i}`

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Cancel any in-flight fetch on unmount
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setDuplicateError(false)
    setHighlightedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (val.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(
          `/api/v1/cities/search?q=${encodeURIComponent(val)}`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data: CityEntry[] = await res.json()
          setResults(data)
          setShowDropdown(true)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // other errors: silent — search is non-critical
      }
    }, 200) // AUTO-01: 200ms debounce
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(Math.min(highlightedIndex + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(Math.max(highlightedIndex - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        // no preventDefault — let Tab continue normal focus movement
        break
    }
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
    setHighlightedIndex(-1)
  }

  const isFull = cities.length >= 10

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined}
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
        <ul
          role="listbox"
          id={listboxId}
          className="absolute z-10 mt-1 w-full rounded-lg border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm"
        >
          {results.length === 0 ? (
            <li
              role="option"
              aria-disabled="true"
              className="px-4 py-2 text-sm text-gray-500"
            >
              No cities found for &apos;{query}&apos;
            </li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                id={getOptionId(i)}
                aria-selected={i === highlightedIndex}
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); if (!isFull) handleSelect(r) }}
                className={`px-4 py-2 text-sm text-gray-800 cursor-pointer ${
                  i === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                }${isFull ? ' opacity-50 cursor-not-allowed' : ''}`}
              >
                {formatSuggestion(r, query)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
