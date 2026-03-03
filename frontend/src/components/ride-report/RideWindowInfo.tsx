import { Clock, Timer, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RideWindowInfoProps {
  rideStartHour: number
  rideEndHour: number
  estimatedDurationMinutes?: number
  averageSpeedKmh?: number
}

function formatDuration(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return t('report.rideWindow.hours', { h })
  return t('report.rideWindow.hoursMinutes', { h, m })
}

export function RideWindowInfo({ rideStartHour, rideEndHour, estimatedDurationMinutes, averageSpeedKmh }: RideWindowInfoProps) {
  const { t } = useTranslation()

  const startTime = `${rideStartHour.toString().padStart(2, '0')}:00`
  const endTime = `${rideEndHour.toString().padStart(2, '0')}:00`

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-800/50">
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        {t('report.rideWindow.title')}
      </span>
      <div className="flex items-center gap-1.5 text-sm text-stone-700 dark:text-stone-300">
        <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={1.5} />
        <span className="font-medium">{startTime} – {endTime}</span>
      </div>
      {estimatedDurationMinutes != null && estimatedDurationMinutes > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-stone-700 dark:text-stone-300">
          <Timer className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={1.5} />
          <span>{t('report.rideWindow.duration')}: <span className="font-medium">{formatDuration(estimatedDurationMinutes, t)}</span></span>
        </div>
      )}
      {averageSpeedKmh != null && averageSpeedKmh > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-stone-700 dark:text-stone-300">
          <Gauge className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={1.5} />
          <span>{t('report.rideWindow.avgSpeed')}: <span className="font-medium">{averageSpeedKmh} km/h</span></span>
        </div>
      )}
    </div>
  )
}
