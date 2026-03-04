import { Plus, Minus, Clock, MapPin, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Waypoint, WaypointType, LocationSuggestion } from './types'
import { LocationPicker } from './LocationPicker'

interface WaypointListProps {
  waypoints: Waypoint[]
  suggestions?: LocationSuggestion[]
  onWaypointSearch?: (waypointIndex: number, query: string) => void
  onChange: (waypoints: Waypoint[]) => void
}

export function WaypointList({
  waypoints,
  suggestions = [],
  onWaypointSearch,
  onChange,
}: WaypointListProps) {
  const { t } = useTranslation()

  const handleAdd = () => {
    onChange([...waypoints, { location: {}, type: 'stop' }])
  }

  const handleRemove = (index: number) => {
    onChange(waypoints.filter((_, i) => i !== index))
  }

  const handleSelectSuggestion = (index: number, suggestion: LocationSuggestion) => {
    const updated = waypoints.map((wp, i) =>
      i === index
        ? { ...wp, location: { address: suggestion.shortText, lat: suggestion.lat, lon: suggestion.lon } }
        : wp
    )
    onChange(updated)
  }

  const handleClearLocation = (index: number) => {
    const updated = waypoints.map((wp, i) =>
      i === index ? { ...wp, location: {} } : wp
    )
    onChange(updated)
  }

  const handleTypeChange = (index: number, type: WaypointType) => {
    const updated = waypoints.map((wp, i) =>
      i === index
        ? {
            ...wp,
            type,
            startTime: type === 'sleep' ? (wp.startTime ?? '08:00') : undefined,
            plannedKm: type === 'sleep' ? wp.plannedKm : undefined,
          }
        : wp
    )
    onChange(updated)
  }

  const handleNameChange = (index: number, name: string) => {
    const updated = waypoints.map((wp, i) =>
      i === index ? { ...wp, name: name || undefined } : wp
    )
    onChange(updated)
  }

  const handleStartTimeChange = (index: number, value: string) => {
    const updated = waypoints.map((wp, i) =>
      i === index ? { ...wp, startTime: value } : wp
    )
    onChange(updated)
  }

  const handleKmChange = (index: number, value: string) => {
    const updated = waypoints.map((wp, i) =>
      i === index ? { ...wp, plannedKm: value ? Number(value) : null } : wp
    )
    onChange(updated)
  }

  // Calculate day numbers based on sleep waypoints
  const sleepCount = waypoints.filter(wp => wp.type === 'sleep').length
  const totalDays = sleepCount + 1

  // Compute day number for display context
  let currentDay = 1
  const dayNumbers = waypoints.map(wp => {
    if (wp.type === 'sleep') {
      currentDay++
      return currentDay
    }
    return currentDay
  })

  return (
    <div className="space-y-3">
      {/* Waypoints */}
      {waypoints.map((wp, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-2">
            {wp.type === 'sleep' ? (
              <Moon className="w-3 h-3 text-indigo-400 dark:text-indigo-500" strokeWidth={2} />
            ) : (
              <MapPin className="w-3 h-3 text-emerald-400 dark:text-emerald-600" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            {/* Day label for sleep waypoints */}
            {wp.type === 'sleep' && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">
                {t('waypoints.dayLabel', { n: dayNumbers[index] })}
              </span>
            )}

            {/* Location picker */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <LocationPicker
                  value={wp.location.address ? wp.location as { address: string; lat?: number; lon?: number } : null}
                  suggestions={suggestions}
                  onSearch={q => onWaypointSearch?.(index, q)}
                  onSelect={s => handleSelectSuggestion(index, s)}
                  onClear={() => handleClearLocation(index)}
                  placeholder={t('waypoints.waypointName')}
                  compact
                  hideLocate
                />
              </div>
            </div>

            {/* Type toggle + name */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleTypeChange(index, 'stop')}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors ${
                    wp.type === 'stop'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  🚩 {t('waypoints.waypointStop')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(index, 'sleep')}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium border-l border-stone-200 dark:border-stone-700 transition-colors ${
                    wp.type === 'sleep'
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  🛏️ {t('waypoints.waypointSleep')}
                </button>
              </div>

              {/* Name input */}
              <input
                type="text"
                value={wp.name ?? ''}
                onChange={e => handleNameChange(index, e.target.value)}
                placeholder={t('waypoints.waypointName')}
                className="flex-1 min-w-[100px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 px-2"
              />
            </div>

            {/* Sleep-specific fields: start time + planned km */}
            {wp.type === 'sleep' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Clock
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 dark:text-stone-500 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <input
                    type="time"
                    value={wp.startTime ?? '08:00'}
                    onChange={e => handleStartTimeChange(index, e.target.value)}
                    className="w-[110px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 pl-7 pr-2"
                  />
                </div>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={wp.plannedKm ?? ''}
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
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              <Minus className="w-3 h-3" strokeWidth={2.5} />
              {t('waypoints.removeWaypoint')}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ml-7"
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
        {t('waypoints.addWaypoint')}
      </button>

      {sleepCount > 0 && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500 ml-7">
          {t('waypoints.ridingDays', { count: totalDays })}
        </p>
      )}
    </div>
  )
}
