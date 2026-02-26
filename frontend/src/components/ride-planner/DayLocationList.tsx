import { Plus, Calendar, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RideLocation, DayStop, LocationSuggestion } from './types'
import { LocationPicker } from './LocationPicker'

interface DayLocationListProps {
  startLocation: RideLocation | null
  /** The main ride startDate (YYYY-MM-DD) used to auto-calculate per-stop dates */
  startDate?: string
  /** The main ride startTime (HH:MM) shown for Day 1 context */
  startTime?: string
  dayStops: DayStop[]
  suggestions?: LocationSuggestion[]
  onStopSearch?: (stopIndex: number, query: string) => void
  onChange: (stops: DayStop[]) => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function DayLocationList({
  startLocation,
  startDate,
  startTime,
  dayStops,
  suggestions = [],
  onStopSearch,
  onChange,
}: DayLocationListProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'

  const handleAdd = () => {
    // Default date = previous stop's date + 1, or startDate + 1 for the first stop
    const prevDate =
      dayStops.length > 0
        ? dayStops[dayStops.length - 1].startDate
        : startDate
    const defaultDate = prevDate ? addDays(prevDate, 1) : ''
    onChange([...dayStops, { location: { address: '' }, plannedKm: null, startDate: defaultDate, startTime: '08:00' }])
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

  const handleDateChange = (index: number, value: string) => {
    const updated = dayStops.map((stop, i) =>
      i === index ? { ...stop, startDate: value } : stop
    )
    onChange(updated)
  }

  const handleTimeChange = (index: number, value: string) => {
    const updated = dayStops.map((stop, i) =>
      i === index ? { ...stop, startTime: value } : stop
    )
    onChange(updated)
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const totalDays = dayStops.length + 1

  return (
    <div className="space-y-3">
      {/* Start location (read-only context) */}
      <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-stone-600 dark:text-stone-400">
            {t('dayList.dayLabel', { n: 1 })}: {startLocation?.address || t('planner.label.startLocation')}
          </span>
          {startDate && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              {formatDate(startDate)}{startTime ? ` · ${startTime}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Overnight stops */}
      {dayStops.map((stop, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600" />
          </div>

          <div className="flex-1 space-y-1.5">
            {/* Day label */}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {t('dayList.dayLabel', { n: index + 2 })}
            </span>

            <div className="flex items-start gap-2">
              <div className="flex-1">
                <LocationPicker
                  value={stop.location.address ? stop.location : null}
                  suggestions={suggestions}
                  onSearch={q => onStopSearch?.(index, q)}
                  onSelect={s => handleSelectSuggestion(index, s)}
                  onClear={() => handleClearLocation(index)}
                  placeholder={t('dayList.overnightStop', { n: index + 1 })}
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
                  {t('common.remove')}
                </button>
              )}
            </div>

            {/* Date, Time, km row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date */}
              <div className="relative">
                <Calendar
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 dark:text-stone-500 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="date"
                  value={stop.startDate ?? ''}
                  onChange={e => handleDateChange(index, e.target.value)}
                  className="w-[130px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 pl-7 pr-2"
                />
              </div>
              {/* Time */}
              <div className="relative">
                <Clock
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 dark:text-stone-500 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="time"
                  value={stop.startTime ?? '08:00'}
                  onChange={e => handleTimeChange(index, e.target.value)}
                  className="w-[90px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 pl-7 pr-2"
                />
              </div>
              {/* km */}
              <div className="relative w-24">
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
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ml-7"
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
        {t('dayList.addStop')}
      </button>

      {dayStops.length > 0 && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500 ml-7">
          {t('dayList.ridingDays', { count: totalDays })}
        </p>
      )}
    </div>
  )
}
