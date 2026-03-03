import { Wind, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { RouteWaypointWeather } from './types'
import type { WeatherIconType } from './types'
import { WeatherIcon } from './WeatherIcon'

interface RouteWeatherSummaryProps {
  waypoints: RouteWaypointWeather[]
  className?: string
}

function windEffectKey(headwind: number): 'headwind' | 'tailwind' | 'neutral' {
  if (headwind > 5) return 'headwind'
  if (headwind < -5) return 'tailwind'
  return 'neutral'
}

const effectStyles = {
  headwind: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300', bar: 'bg-red-500' },
  tailwind: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-300', bar: 'bg-green-500' },
  neutral: { dot: 'bg-stone-400', text: 'text-stone-600 dark:text-stone-400', bar: 'bg-stone-400' },
} as const

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}

export function WindAnalysis({ waypoints, className }: RouteWeatherSummaryProps) {
  const { t } = useTranslation()

  if (!waypoints || waypoints.length === 0) return null

  // Aggregate stats
  const temps = waypoints.map(wp => wp.temp)
  const tempMin = Math.round(Math.min(...temps))
  const tempMax = Math.round(Math.max(...temps))
  const winds = waypoints.map(wp => wp.windSpeed)
  const windMin = Math.round(Math.min(...winds))
  const windMax = Math.round(Math.max(...winds))
  const avgHeadwind = waypoints.reduce((s, wp) => s + wp.headwindComponent, 0) / waypoints.length

  // Most common weather icon
  const iconCounts = new Map<string, number>()
  waypoints.forEach(wp => iconCounts.set(wp.icon, (iconCounts.get(wp.icon) || 0) + 1))
  const dominantIcon = [...iconCounts.entries()].sort((a, b) => b[1] - a[1])[0][0] as WeatherIconType

  // Build segments summary: group consecutive same-effect waypoints
  const hasSegments = waypoints.some(wp => wp.segmentStartKm != null && wp.segmentEndKm != null)

  type EffectGroup = { effect: 'headwind' | 'tailwind' | 'neutral'; startKm: number; endKm: number; durationMin: number }
  const groups: EffectGroup[] = []

  for (const wp of waypoints) {
    const effect = windEffectKey(wp.headwindComponent)
    const startKm = wp.segmentStartKm ?? wp.distanceKm
    const endKm = wp.segmentEndKm ?? wp.distanceKm
    const dur = wp.segmentDurationMinutes ?? 0

    if (groups.length > 0 && groups[groups.length - 1].effect === effect) {
      const last = groups[groups.length - 1]
      last.endKm = endKm
      last.durationMin += dur
    } else {
      groups.push({ effect, startKm, endKm, durationMin: dur })
    }
  }

  // Total route distance
  const totalKm = hasSegments
    ? Math.round(waypoints[waypoints.length - 1].segmentEndKm ?? waypoints[waypoints.length - 1].distanceKm)
    : Math.round(waypoints[waypoints.length - 1].distanceKm)

  const overallEffect = windEffectKey(avgHeadwind)

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <Route className="w-5 h-5" />
        {t('report.windAnalysis.title', 'Route Conditions')}
      </h3>

      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 p-4 space-y-4">
        {/* Summary stats row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <WeatherIcon icon={dominantIcon} className="w-5 h-5" />
            <span className="text-stone-700 dark:text-stone-200">
              {tempMin === tempMax ? `${tempMin}°C` : `${tempMin}–${tempMax}°C`}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-stone-400" />
            <span className="text-stone-700 dark:text-stone-200">
              {windMin === windMax ? `${windMin} km/h` : `${windMin}–${windMax} km/h`}
            </span>
          </span>
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            overallEffect === 'headwind' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
            overallEffect === 'tailwind' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}>
            {t(`report.windAnalysis.${overallEffect}`)} {Math.round(Math.abs(avgHeadwind))} km/h avg
          </span>
        </div>

        {/* Segment bar — visual overview */}
        {groups.length > 1 && totalKm > 0 && (
          <div className="space-y-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {groups.map((g, i) => {
                const pct = Math.max(((g.endKm - g.startKm) / totalKm) * 100, 2)
                return (
                  <div
                    key={i}
                    className={`${effectStyles[g.effect].bar} rounded-full`}
                    style={{ width: `${pct}%` }}
                    title={`${Math.round(g.startKm)}–${Math.round(g.endKm)} km: ${g.effect}`}
                  />
                )
              })}
            </div>

            {/* Segment labels */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              {groups.map((g, i) => {
                const len = Math.round(g.endKm - g.startKm)
                return (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${effectStyles[g.effect].dot}`} />
                    <span>
                      {Math.round(g.startKm)}–{Math.round(g.endKm)} km
                      {len > 0 && ` (${len} km`}
                      {g.durationMin > 0 && `, ${formatDuration(g.durationMin)}`}
                      {len > 0 && ')'}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
