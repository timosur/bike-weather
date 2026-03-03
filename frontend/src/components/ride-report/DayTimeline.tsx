import { MapPin, Clock, Timer, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DayForecast, ConditionRating } from './types'
import { WeatherIcon } from './WeatherIcon'

const conditionDot: Record<ConditionRating, string> = {
  ideal: 'bg-emerald-500',
  good: 'bg-amber-500',
  caution: 'bg-orange-500',
  'not-recommended': 'bg-red-500',
}

const conditionBg: Record<ConditionRating, string> = {
  ideal: 'ring-emerald-200 dark:ring-emerald-800/50',
  good: 'ring-amber-200 dark:ring-amber-800/50',
  caution: 'ring-orange-200 dark:ring-orange-800/50',
  'not-recommended': 'ring-red-200 dark:ring-red-800/50',
}

interface DayTimelineProps {
  days: DayForecast[]
}

function formatDuration(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return t('report.rideWindow.hours', { h })
  return t('report.rideWindow.hoursMinutes', { h, m })
}

export function DayTimeline({ days }: DayTimelineProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const startTime = day.rideStartTime || (day.rideStartHour != null ? `${day.rideStartHour.toString().padStart(2, '0')}:00` : null)
        const endTime = day.rideEndTime || (day.rideEndHour != null ? `${day.rideEndHour.toString().padStart(2, '0')}:00` : null)

        return (
          <div
            key={day.id}
            className={`rounded-xl bg-white dark:bg-stone-900 ring-1 ${conditionBg[day.condition]} overflow-hidden`}
          >
            <div className="px-4 py-3 space-y-2">
              {/* Day header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {day.dayLabel}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{day.date}</span>
                  {day.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 truncate">
                      <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{day.location}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${conditionDot[day.condition]}`} />
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    {t(`report.condition.${day.condition === 'not-recommended' ? 'notRecommended' : day.condition}`)}
                  </span>
                </div>
              </div>

              {/* Ride info + weather summary row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                {/* Weather icon + description */}
                <span className="inline-flex items-center gap-1.5">
                  <WeatherIcon icon={day.weather.icon} className="w-4 h-4 text-amber-500" />
                  <span>{day.weather.description}</span>
                </span>

                {/* Temperature range */}
                <span className="font-medium">
                  {day.weather.tempMax}{day.weather.tempUnit} / {day.weather.tempMin}{day.weather.tempUnit}
                </span>

                {/* Ride window */}
                {startTime && endTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-500" strokeWidth={1.5} />
                    {startTime} – {endTime}
                  </span>
                )}

                {/* Duration */}
                {day.estimatedDurationMinutes != null && day.estimatedDurationMinutes > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-3 h-3 text-emerald-500" strokeWidth={1.5} />
                    {formatDuration(day.estimatedDurationMinutes, t)}
                  </span>
                )}

                {/* Avg speed */}
                {day.averageSpeedKmh != null && day.averageSpeedKmh > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-500" strokeWidth={1.5} />
                    {day.averageSpeedKmh} km/h
                  </span>
                )}
              </div>

              {/* Weather summary text */}
              {day.weatherSummary && (
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {day.weatherSummary}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
