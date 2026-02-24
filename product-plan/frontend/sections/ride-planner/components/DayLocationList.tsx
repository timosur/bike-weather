import { Plus } from 'lucide-react'
import type { RideLocation, DayStop, LocationSuggestion } from '../types'
import { LocationPicker } from './LocationPicker'

interface DayLocationListProps {
  startLocation: RideLocation | null
  dayStops: DayStop[]
  suggestions?: LocationSuggestion[]
  onStopSearch?: (stopIndex: number, query: string) => void
  onChange: (stops: DayStop[]) => void
}

export function DayLocationList({
  startLocation,
  dayStops,
  suggestions = [],
  onStopSearch,
  onChange,
}: DayLocationListProps) {
  const handleAdd = () => {
    onChange([...dayStops, { location: { address: '' }, plannedKm: null }])
  }

  const handleRemove = (index: number) => {
    onChange(dayStops.filter((_, i) => i !== index))
  }

  const handleSelectSuggestion = (index: number, suggestion: LocationSuggestion) => {
    const updated = dayStops.map((stop, i) =>
      i === index
        ? { ...stop, location: { address: suggestion.shortText, lat: suggestion.lat, lon: suggestion.lon } }
        : stop
    )
    onChange(updated)
  }

  const handleClearLocation = (index: number) => {
    const updated = dayStops.map((stop, i) =>
      i === index ? { ...stop, location: { address: '' } } : stop
    )
    onChange(updated)
  }

  const handleKmChange = (index: number, value: string) => {
    const updated = dayStops.map((stop, i) =>
      i === index ? { ...stop, plannedKm: value ? Number(value) : null } : stop
    )
    onChange(updated)
  }

  const totalDays = dayStops.length + 1

  return (
    <div className="space-y-3">
      {/* Start location (read-only context) */}
      <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <span className="font-medium text-stone-600 dark:text-stone-400">
          Day 1: {startLocation?.address || 'Start location'}
        </span>
      </div>

      {/* Overnight stops */}
      {dayStops.map((stop, index) => (
        <div key={index} className="flex items-start gap-2">
          {/* Connecting dot */}
          <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600" />
          </div>

          {/* Location + km */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <LocationPicker
                  value={stop.location.address ? stop.location : null}
                  suggestions={suggestions}
                  onSearch={q => onStopSearch?.(index, q)}
                  onSelect={s => handleSelectSuggestion(index, s)}
                  onClear={() => handleClearLocation(index)}
                  placeholder={`Overnight stop ${index + 1}…`}
                  compact
                  hideLocate
                />
              </div>
              {stop.location.address && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="mt-1.5 p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs font-medium shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="relative w-28">
              <input
                type="number"
                min="1"
                max="999"
                value={stop.plannedKm ?? ''}
                onChange={e => handleKmChange(index, e.target.value)}
                placeholder="km"
                className="w-full rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 pl-3 pr-8"
              />
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-stone-400 dark:text-stone-500 pointer-events-none"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                km
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ml-7"
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
        Add overnight stop
      </button>

      {/* Day count summary */}
      {dayStops.length > 0 && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500 ml-7">
          {totalDays} riding days · Weather fetched per day at each start location
        </p>
      )}
    </div>
  )
}
