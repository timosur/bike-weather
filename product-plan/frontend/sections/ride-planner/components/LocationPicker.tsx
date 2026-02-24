import { useState, useRef, useEffect } from 'react'
import { Search, Navigation, MapPin, X, Loader2 } from 'lucide-react'
import type { RideLocation, LocationSuggestion } from '../types'

interface LocationPickerProps {
  value: RideLocation | null
  suggestions?: LocationSuggestion[]
  isLocating?: boolean
  onSearch?: (query: string) => void
  onSelect?: (suggestion: LocationSuggestion) => void
  onUseCurrentLocation?: () => void
  onClear?: () => void
  placeholder?: string
  error?: string
  compact?: boolean
  /** Hide the "Detect location" GPS button */
  hideLocate?: boolean
}

export function LocationPicker({
  value,
  suggestions = [],
  isLocating = false,
  onSearch,
  onSelect,
  onUseCurrentLocation,
  onClear,
  placeholder = 'City or address…',
  error,
  compact = false,
  hideLocate = false,
}: LocationPickerProps) {
  const [mode, setMode] = useState<'idle' | 'search'>('idle')
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        if (!value && mode === 'search') setMode('idle')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [value, mode])

  // Focus input when entering search mode
  useEffect(() => {
    if (mode === 'search') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [mode])

  const handleSearchClick = () => {
    setMode('search')
    setQuery('')
    setShowSuggestions(false)
  }

  const handleLocateClick = () => {
    onUseCurrentLocation?.()
  }

  const handleInput = (val: string) => {
    setQuery(val)
    if (val.length > 1) setShowSuggestions(true)
    else setShowSuggestions(false)
    onSearch?.(val)
  }

  const handleSelect = (suggestion: LocationSuggestion) => {
    setQuery('')
    setShowSuggestions(false)
    setMode('idle')
    onSelect?.(suggestion)
  }

  const handleClear = () => {
    setQuery('')
    setMode('idle')
    setShowSuggestions(false)
    onClear?.()
  }

  const handleCancel = () => {
    setQuery('')
    setMode('idle')
    setShowSuggestions(false)
  }

  const py = compact ? 'py-2' : 'py-2.5'
  const textSize = compact ? 'text-xs' : 'text-sm'

  // Selected state — show address with edit button
  if (value?.address) {
    return (
      <div className="space-y-1" ref={containerRef}>
        <div
          className={`flex items-center gap-2 ${py} px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={1.5} />
          <span className={`flex-1 ${textSize} font-medium text-emerald-700 dark:text-emerald-300 truncate`}>
            {value.address}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-emerald-400 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  // Search mode — input with autocomplete
  if (mode === 'search') {
    return (
      <div className="space-y-1" ref={containerRef}>
        <div className="relative">
          <div className="relative flex items-center">
            <Search
              className="absolute left-3 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-xl ${textSize} bg-stone-50 dark:bg-stone-800 border ${
                error
                  ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30'
                  : 'border-stone-200 dark:border-stone-700'
              } text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all ${py} pl-9 pr-10`}
            />
            <button
              type="button"
              onClick={handleCancel}
              className="absolute right-2 p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 top-full mt-1.5 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left border-b border-stone-100 dark:border-stone-800 last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">{s.shortText}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{s.displayText}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  // Idle state — action buttons
  return (
    <div className="space-y-1" ref={containerRef}>
      <div className={`grid ${hideLocate ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        <button
          type="button"
          onClick={handleSearchClick}
          className={`flex items-center justify-center gap-2 ${py} px-3 rounded-xl ${textSize} font-medium border-2 border-dashed border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all`}
        >
          <Search className="w-4 h-4" strokeWidth={1.5} />
          Search location
        </button>
        {!hideLocate && (
          <button
            type="button"
            onClick={handleLocateClick}
            disabled={isLocating}
            className={`flex items-center justify-center gap-2 ${py} px-3 rounded-xl ${textSize} font-medium border-2 border-dashed border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all disabled:opacity-50`}
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Navigation className="w-4 h-4" strokeWidth={1.5} />
            )}
            {isLocating ? 'Detecting…' : 'Detect location'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
