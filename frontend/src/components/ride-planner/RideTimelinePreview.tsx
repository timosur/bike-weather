import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Waypoint } from './types'
import { formatClock, type Leg } from '../../lib/rideLegs'
import { formatTime } from '../../lib/timeFormat'

interface RideTimelinePreviewProps {
  legs: Leg[]
  waypoints: Waypoint[]
  startLabel: string
  destinationLabel: string
}

const DAY_MIN = 24 * 60

/** Estimated schedule of the ride: start, each pause/overnight, arrival. */
export function RideTimelinePreview({ legs, waypoints, startLabel, destinationLabel }: RideTimelinePreviewProps) {
  const { t } = useTranslation()
  const time = (min: number) => formatTime(formatClock(min))
  const clock = (min: number) => {
    const days = Math.floor(min / DAY_MIN)
    return days > 0 ? `${time(min)} (+${days})` : time(min)
  }
  const last = legs[legs.length - 1]

  return (
    <div className="space-y-1.5">
      <ol
        aria-label={t('planner.timeline.title')}
        className="rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800 text-xs"
      >
        <li className="flex items-baseline gap-3 px-3 py-2">
          <span className="w-20 shrink-0 font-mono text-stone-700 dark:text-stone-200">{clock(legs[0].startMin)}</span>
          <span className="font-medium text-stone-700 dark:text-stone-200 truncate">{startLabel}</span>
        </li>

        {legs.slice(1).map((leg, i) => {
          const prev = legs[i]
          const wp = leg.waypointIndex != null ? waypoints[leg.waypointIndex] : undefined
          const early = leg.splitType === 'pause' && leg.startMin < prev.endMin
          const departure = leg.splitType === 'pause'
            ? `☕ ${t('waypoints.until')} ${time(leg.startMin)}`
            : `🛏️ ${t('waypoints.nextDay')} ${time(leg.startMin)}`
          return (
            <li
              key={leg.index}
              className={`flex items-baseline gap-3 px-3 py-2 ${early ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}
            >
              <span className="w-20 shrink-0 font-mono text-stone-500 dark:text-stone-400">~{clock(prev.endMin)}</span>
              <span className="flex-1 min-w-0 space-y-0.5">
                <span className="block font-medium text-stone-700 dark:text-stone-200 truncate">
                  {wp?.name || wp?.location.address || '—'}
                </span>
                <span className={`block ${leg.splitType === 'pause' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400'}`}>
                  {departure}
                </span>
                {early && (
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2} />
                    {t('planner.timeline.earlyDeparture')}
                  </span>
                )}
              </span>
            </li>
          )
        })}

        <li className="flex items-baseline gap-3 px-3 py-2">
          <span className="w-20 shrink-0 font-mono text-stone-500 dark:text-stone-400">~{clock(last.endMin)}</span>
          <span className="font-medium text-stone-700 dark:text-stone-200 truncate">{destinationLabel}</span>
        </li>
      </ol>
      <p className="text-[11px] text-stone-400 dark:text-stone-500">{t('planner.timeline.hint')}</p>
    </div>
  )
}
