import { Plus, Minus, Clock, MapPin, Moon, Coffee } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Waypoint, WaypointType, LocationSuggestion } from './types'
import { LocationPicker } from './LocationPicker'
import { InfoTooltip } from '../common/InfoTooltip'

const DEFAULT_DEPARTURE = { pause: '17:00', sleep: '08:00' } as const

/** Literal class strings per tone so Tailwind can pick them up */
const DEPARTURE_TONE = {
  indigo: {
    label: 'text-indigo-500 dark:text-indigo-400',
    icon: 'text-indigo-400 dark:text-indigo-500',
    input: 'border-indigo-200 dark:border-indigo-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 focus:border-indigo-400 dark:focus:border-indigo-600',
  },
  amber: {
    label: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-500',
    input: 'border-amber-200 dark:border-amber-700 focus:ring-amber-100 dark:focus:ring-amber-900/40 focus:border-amber-400 dark:focus:border-amber-600',
  },
} as const

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
          startTime: type === 'stop' ? undefined : (wp.startTime ?? DEFAULT_DEPARTURE[type]),
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

  const renderDepartureTime = (index: number, wp: Waypoint, label: string, tone: keyof typeof DEPARTURE_TONE) => {
    const c = DEPARTURE_TONE[tone]
    return (
      <div className="flex items-center gap-2">
        <span className={`text-[11px] whitespace-nowrap ${c.label}`}>{label}</span>
        <div className="relative">
          <Clock
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${c.icon}`}
            strokeWidth={1.5}
          />
          <input
            type="time"
            aria-label={label}
            value={wp.startTime ?? DEFAULT_DEPARTURE[wp.type as keyof typeof DEFAULT_DEPARTURE]}
            onChange={e => handleStartTimeChange(index, e.target.value)}
            className={`w-[110px] rounded-lg text-xs bg-white dark:bg-stone-800 border text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 transition-all py-1.5 pl-7 pr-2 ${c.input}`}
          />
        </div>
      </div>
    )
  }

  // Calculate day numbers based on sleep waypoints
  const sleepCount = waypoints.filter(wp => wp.type === 'sleep').length
  const totalDays = sleepCount + 1

  return (
    <div className="space-y-3">
      {/* Waypoints */}
      {waypoints.map((wp, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-2">
            {wp.type === 'sleep' ? (
              <Moon className="w-3 h-3 text-indigo-400 dark:text-indigo-500" strokeWidth={2} />
            ) : wp.type === 'pause' ? (
              <Coffee className="w-3 h-3 text-amber-500 dark:text-amber-500" strokeWidth={2} />
            ) : (
              <MapPin className="w-3 h-3 text-emerald-400 dark:text-emerald-600" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
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
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors ${wp.type === 'stop'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                    }`}
                >
                  🚩 {t('waypoints.waypointStop')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(index, 'pause')}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium border-l border-stone-200 dark:border-stone-700 transition-colors ${wp.type === 'pause'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                    }`}
                >
                  ☕ {t('waypoints.waypointPause')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(index, 'sleep')}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium border-l border-stone-200 dark:border-stone-700 transition-colors ${wp.type === 'sleep'
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
                className="flex-1 min-w-[100px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1.5 px-2"
              />
            </div>

            {/* Overnight day divider */}
            {wp.type === 'sleep' && (
              <div className="mt-2 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-indigo-200 dark:bg-indigo-800/50" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500 flex items-center gap-1">
                    🛏️ {t('waypoints.overnightDivider')}
                  </span>
                  <div className="flex-1 h-px bg-indigo-200 dark:bg-indigo-800/50" />
                </div>
                {renderDepartureTime(index, wp, t('waypoints.departureNextDay'), 'indigo')}
              </div>
            )}

            {/* Same-day pause departure */}
            {wp.type === 'pause' && (
              <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
                {renderDepartureTime(index, wp, t('waypoints.departureSameDay'), 'amber')}
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

      <span className="flex items-center gap-1.5 ml-7">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          {t('waypoints.addWaypoint')}
        </button>
        <InfoTooltip content={t('planner.tooltip.waypoints')} />
      </span>

      {sleepCount > 0 && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500 ml-7">
          {t('waypoints.ridingDays', { count: totalDays })}
        </p>
      )}
    </div>
  )
}
