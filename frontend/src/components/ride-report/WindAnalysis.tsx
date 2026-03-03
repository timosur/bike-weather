import { Wind, Clock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { RouteWaypointWeather } from './types'
import { WeatherIcon } from './WeatherIcon'

interface WindAnalysisProps {
  waypoints: RouteWaypointWeather[]
  className?: string
}

function windEffectColor(headwind: number) {
  if (headwind > 5) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' }
  if (headwind < -5) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' }
  if (Math.abs(headwind) <= 5) return { bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-600 dark:text-stone-400', dot: 'bg-stone-400' }
  return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' }
}

function windEffectLabel(headwind: number, t: (key: string) => string) {
  if (headwind > 5) return t('report.windAnalysis.headwind')
  if (headwind < -5) return t('report.windAnalysis.tailwind')
  return t('report.windAnalysis.neutral')
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}

export function WindAnalysis({ waypoints, className }: WindAnalysisProps) {
  const { t } = useTranslation()

  if (!waypoints || waypoints.length === 0) return null

  const avgHeadwind = waypoints.reduce((sum, wp) => sum + wp.headwindComponent, 0) / waypoints.length
  
  const overallStatus =
    avgHeadwind > 5
      ? 'Headwind'
      : avgHeadwind < -5
      ? 'Tailwind'
      : 'Neutral'

  const hasSegments = waypoints.some(wp => wp.segmentStartKm != null && wp.segmentEndKm != null)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <Wind className="w-5 h-5" />
          {t('report.windAnalysis.title', 'Wind Analysis')}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          overallStatus === 'Headwind' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
          overallStatus === 'Tailwind' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
          'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
        }`}>
          {overallStatus === 'Headwind' ? t('report.windAnalysis.headwind') : 
           overallStatus === 'Tailwind' ? t('report.windAnalysis.tailwind') : 
           t('report.windAnalysis.neutral')} ({Math.round(Math.abs(avgHeadwind))} km/h avg)
        </span>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 divide-y divide-stone-200 dark:divide-stone-800">
        {waypoints.map((wp) => {
          const colors = windEffectColor(wp.headwindComponent)
          const segmentLength = hasSegments && wp.segmentStartKm != null && wp.segmentEndKm != null
            ? wp.segmentEndKm - wp.segmentStartKm
            : null

          return (
            <div key={wp.index} className="px-4 py-3 flex flex-col gap-2">
              {/* Row 1: Distance range + travel time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasSegments && wp.segmentStartKm != null && wp.segmentEndKm != null ? (
                    <span className="font-mono text-sm font-medium text-stone-700 dark:text-stone-200">
                      {Math.round(wp.segmentStartKm)} <ArrowRight className="w-3 h-3 inline" /> {Math.round(wp.segmentEndKm)} km
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-medium text-stone-700 dark:text-stone-200">
                      {Math.round(wp.distanceKm)} km
                    </span>
                  )}
                  {segmentLength != null && segmentLength > 0 && (
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      ({segmentLength.toFixed(1)} km)
                    </span>
                  )}
                </div>
                {wp.segmentDurationMinutes != null && wp.segmentDurationMinutes > 0 && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(wp.segmentDurationMinutes)}
                  </span>
                )}
              </div>

              {/* Row 2: Wind effect + weather */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {windEffectLabel(wp.headwindComponent, t)}
                  </span>
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {wp.headwindComponent > 0 ? '+' : ''}{Math.round(wp.headwindComponent)} km/h
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-sm text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-stone-400" />
                    {Math.round(wp.windSpeed)} km/h {wp.windDirection}
                  </span>
                  <span className="flex items-center gap-1">
                    <WeatherIcon icon={wp.icon} className="w-4 h-4" />
                    {Math.round(wp.temp)}°C
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
