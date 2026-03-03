import { Wind } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { RouteWaypointWeather } from './types'
import { WeatherIcon } from './WeatherIcon'

interface WindAnalysisProps {
  waypoints: RouteWaypointWeather[]
  className?: string
}

export function WindAnalysis({ waypoints, className }: WindAnalysisProps) {
  const { t } = useTranslation()

  if (!waypoints || waypoints.length === 0) return null

  // Calculate stats
  const avgHeadwind = waypoints.reduce((sum, wp) => sum + wp.headwindComponent, 0) / waypoints.length
  
  const overallStatus =
    avgHeadwind > 5
      ? 'Headwind'
      : avgHeadwind < -5
      ? 'Tailwind'
      : 'Neutral'

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

      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4 space-y-3 ring-1 ring-stone-200 dark:ring-stone-800">
        {waypoints.map((wp) => (
          <div key={wp.index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 w-24 shrink-0">
              <span className="text-stone-500 dark:text-stone-400 font-mono w-12 text-right">{Math.round(wp.distanceKm)}km</span>
              <WeatherIcon icon={wp.icon} className="w-4 h-4 text-stone-600 dark:text-stone-300" />
            </div>
            
            <div className="flex-1 flex items-center gap-2 justify-center px-2">
               <div className="flex items-center gap-1.5 whitespace-nowrap">
                 <span className="text-stone-400 dark:text-stone-500 text-xs hidden sm:inline">{t('report.weather.wind')}:</span>
                 <span className="font-medium text-stone-700 dark:text-stone-300">{Math.round(wp.windSpeed)} km/h {wp.windDirection}</span>
               </div>
            </div>

            <div className={`w-24 text-right font-medium shrink-0 ${
              wp.headwindComponent > 3 ? 'text-red-600 dark:text-red-400' : 
              wp.headwindComponent < -3 ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'
            }`}>
              {wp.headwindComponent > 0 ? '+' : ''}{Math.round(wp.headwindComponent)} km/h
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
