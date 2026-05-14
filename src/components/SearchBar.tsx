'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const listboxId = useId()
  const getOptionId = (i: number) => `${listboxId}-opt-${i}`

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [updateDropdownPosition])

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
          updateDropdownPosition()
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
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
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
          placeholder={isFull ? 'Maximum 10 cities reached' : 'Search for a city...'}
          disabled={isFull}
          className={`w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/50 backdrop-blur-xl transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/30 ${isFull ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/15'}`}
        />
        {isFull && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )}
      </div>

      {duplicateError && (
        <div className="absolute -bottom-8 left-0 right-0 flex items-center gap-1 text-sm text-amber-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>City already added</span>
        </div>
      )}

      {showDropdown && createPortal(
        <ul
          role="listbox"
          id={listboxId}
          style={dropdownStyle}
          className="z-[9999] overflow-hidden rounded-xl border border-white/20 bg-slate-800/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {results.length === 0 ? (
            <li
              role="option"
              aria-disabled="true"
              className="px-4 py-3 text-sm text-white/50"
            >
              No cities found for &apos;{query}&apos;
            </li>
          ) : (
            results.map((r, i) => {
              const alreadyAdded = cities.some((c) => c.id === r.id)
              const isDisabled = isFull || alreadyAdded
              return (
                <li
                  key={r.id}
                  role="option"
                  id={getOptionId(i)}
                  aria-selected={i === highlightedIndex}
                  aria-disabled={isDisabled}
                  tabIndex={-1}
                  onMouseDown={(e) => { e.preventDefault(); if (!isDisabled) handleSelect(r) }}
                  className={`border-b border-white/5 px-4 py-3 text-sm transition-colors last:border-0 ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : i === highlightedIndex
                        ? 'cursor-pointer bg-sky-500/20 text-white'
                        : 'cursor-pointer text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {formatSuggestion(r, query)}
                    </div>
                    {alreadyAdded && (
                      <span className="shrink-0 rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-300">
                        Added
                      </span>
                    )}
                  </div>
                </li>
              )
            })
          )}
        </ul>,
        document.body
      )}
    </div>
  )
}
