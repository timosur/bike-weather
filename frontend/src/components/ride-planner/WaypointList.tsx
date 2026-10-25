import { useEffect, useRef } from 'react'
import { Plus, X, Clock, MapPin, Moon, Coffee } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Waypoint, WaypointType, LocationSuggestion } from './types'
import { LocationPicker } from './LocationPicker'
import { InfoTooltip } from '../common/InfoTooltip'

const DEFAULT_DEPARTURE = { pause: '17:00', sleep: '08:00' } as const

/** Literal class strings per type so Tailwind can pick them up */
const TYPE_TONE = {
  stop: {
    row: 'border-emerald-200 dark:border-emerald-800/60',
    active: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
    label: '',
    input: '',
  },
  pause: {
    row: 'border-amber-300 dark:border-amber-700/70',
    active: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
    label: 'text-amber-600 dark:text-amber-400',
    input: 'border-amber-200 dark:border-amber-700 focus:ring-amber-100 dark:focus:ring-amber-900/40 focus:border-amber-400 dark:focus:border-amber-600',
  },
  sleep: {
    row: 'border-indigo-300 dark:border-indigo-700/70',
    active: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
    label: 'text-indigo-500 dark:text-indigo-400',
    input: 'border-indigo-200 dark:border-indigo-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 focus:border-indigo-400 dark:focus:border-indigo-600',
  },
} as const

const TYPE_OPTIONS: { type: WaypointType; icon: string; key: string }[] = [
  { type: 'stop', icon: '🚩', key: 'waypoints.waypointStop' },
  { type: 'pause', icon: '☕', key: 'waypoints.waypointPause' },
  { type: 'sleep', icon: '🛏️', key: 'waypoints.waypointSleep' },
]

interface WaypointListProps {
  waypoints: Waypoint[]
  suggestions?: LocationSuggestion[]
  onWaypointSearch?: (waypointIndex: number, query: string) => void
  onChange: (waypoints: Waypoint[]) => void
  /** Focus this waypoint's departure time input (e.g. after "Back to start") */
  focusIndex?: number | null
}

export function WaypointList({
  waypoints,
  suggestions = [],
  onWaypointSearch,
  onChange,
  focusIndex,
}: WaypointListProps) {
  const { t } = useTranslation()
  const timeInputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (focusIndex != null) timeInputs.current[focusIndex]?.focus()
  }, [focusIndex])

  const update = (index: number, patch: Partial<Waypoint>) =>
    onChange(waypoints.map((wp, i) => (i === index ? { ...wp, ...patch } : wp)))

  const handleAdd = () => {
    onChange([...waypoints, { location: {}, type: 'stop' }])
  }

  const handleRemove = (index: number) => {
    onChange(waypoints.filter((_, i) => i !== index))
  }

  const handleTypeChange = (index: number, type: WaypointType) => {
    const wp = waypoints[index]
    if (wp.type === type) return
    // A pause time (afternoon) makes no sense as next-day departure, so each type gets its default
    update(index, { type, startTime: type === 'stop' ? undefined : DEFAULT_DEPARTURE[type] })
  }

  // Calculate day numbers based on sleep waypoints
  const sleepCount = waypoints.filter(wp => wp.type === 'sleep').length
  const totalDays = sleepCount + 1

  return (
    <div className="space-y-3">
      {/* Waypoints */}
      {waypoints.map((wp, index) => {
        const tone = TYPE_TONE[wp.type]
        const timeLabel = wp.type === 'pause' ? t('waypoints.departureSameDay') : t('waypoints.departureNextDay')
        return (
          <div key={index} className={`border-l-2 pl-2 space-y-1.5 ${tone.row}`}>
            {/* Line 1: location + remove */}
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-2">
                {wp.type === 'sleep' ? (
                  <Moon className="w-3 h-3 text-indigo-400 dark:text-indigo-500" strokeWidth={2} />
                ) : wp.type === 'pause' ? (
                  <Coffee className="w-3 h-3 text-amber-500 dark:text-amber-500" strokeWidth={2} />
                ) : (
                  <MapPin className="w-3 h-3 text-emerald-400 dark:text-emerald-600" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <LocationPicker
                  value={wp.location.address ? wp.location as { address: string; lat?: number; lon?: number } : null}
                  suggestions={suggestions}
                  onSearch={q => onWaypointSearch?.(index, q)}
                  onSelect={s => update(index, { location: { address: s.shortText, lat: s.lat, lon: s.lon } })}
                  onClear={() => update(index, { location: {} })}
                  placeholder={t('planner.placeholder.cityOrAddress')}
                  compact
                  hideLocate
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={t('waypoints.removeWaypoint')}
                title={t('waypoints.removeWaypoint')}
                className="mt-1.5 flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Line 2: type toggle + inline departure + name */}
            <div className="flex items-center gap-2 flex-wrap ml-7">
              <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                {TYPE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeChange(index, opt.type)}
                    aria-pressed={wp.type === opt.type}
                    className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors ${i > 0 ? 'border-l border-stone-200 dark:border-stone-700' : ''} ${wp.type === opt.type
                      ? TYPE_TONE[opt.type].active
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                      }`}
                  >
                    {opt.icon} {t(opt.key)}
                  </button>
                ))}
              </div>

              {wp.type !== 'stop' && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] whitespace-nowrap ${tone.label}`}>
                    {wp.type === 'pause' ? t('waypoints.until') : t('waypoints.nextDay')}
                  </span>
                  <div className="relative">
                    <Clock
                      className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${tone.label}`}
                      strokeWidth={1.5}
                    />
                    <input
                      ref={el => { timeInputs.current[index] = el }}
                      type="time"
                      aria-label={timeLabel}
                      value={wp.startTime ?? DEFAULT_DEPARTURE[wp.type]}
                      onChange={e => update(index, { startTime: e.target.value })}
                      className={`w-[8.5rem] rounded-lg text-xs bg-white dark:bg-stone-800 border text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 transition-all py-1 pl-7 pr-2 ${tone.input}`}
                    />
                  </div>
                </div>
              )}

              {/* Name: hidden until requested; '' keeps it open while editing */}
              {wp.name === undefined ? (
                <button
                  type="button"
                  onClick={() => update(index, { name: '' })}
                  className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  + {t('waypoints.addName')}
                </button>
              ) : (
                <input
                  type="text"
                  value={wp.name}
                  // Focus only when opened via "Add name", not for loaded names
                  autoFocus={wp.name === ''}
                  onChange={e => update(index, { name: e.target.value })}
                  aria-label={t('waypoints.waypointName')}
                  placeholder={t('waypoints.waypointName')}
                  className="flex-1 min-w-[100px] rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-1 px-2"
                />
              )}
            </div>
          </div>
        )
      })}

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
