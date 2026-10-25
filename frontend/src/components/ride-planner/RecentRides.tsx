import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Bike, Trash2, ChevronDown, History, ArrowRight } from 'lucide-react'
import type { RideHistoryEntry } from '../../hooks/useRideHistory'

interface RecentRidesProps {
  history: RideHistoryEntry[]
  onSelect: (entry: RideHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
}

function RideCard({
  entry,
  onSelect,
  onRemove,
  formatDate,
  t,
}: {
  entry: RideHistoryEntry
  onSelect: (entry: RideHistoryEntry) => void
  onRemove: (id: string) => void
  formatDate: (ts: number) => string
  t: (key: string) => string
}) {
  const destination = entry.rideInput.destination?.address
  const distance = entry.report.totalDistance || entry.rideInput.distanceKm
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(entry)
        }
      }}
      className="group bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs p-3 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" strokeWidth={1.5} />
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
              {entry.report.startLocation || entry.rideInput.location?.address || '—'}
            </span>
            {destination && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{destination}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              {formatDate(entry.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <Bike className="w-3 h-3" strokeWidth={1.5} />
              {t(`planner.bikeType.${entry.rideInput.bikeType}`)}
            </span>
            {!!distance && (
              <span>{distance} {entry.report.distanceUnit || 'km'}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
            className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title={t('common.remove')}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function RecentRides({ history, onSelect, onRemove, onClear }: RecentRidesProps) {
  const { t, i18n } = useTranslation()
  const [showAll, setShowAll] = useState(false)

  if (history.length === 0) return null

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const VISIBLE_COUNT = 3
  const hasMore = history.length > VISIBLE_COUNT
  const visibleEntries = showAll ? history : history.slice(0, VISIBLE_COUNT)

  return (
    <div className="w-full space-y-3">
      {/* Prominent header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
          <h2 className="text-base font-semibold text-stone-700 dark:text-stone-300" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('planner.recentRides.title')}
          </h2>
          <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
            ({history.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          {t('planner.recentRides.clear')}
        </button>
      </div>

      {/* Always show the latest rides */}
      <div className="space-y-2">
        {visibleEntries.map(entry => (
          <RideCard
            key={entry.id}
            entry={entry}
            onSelect={onSelect}
            onRemove={onRemove}
            formatDate={formatDate}
            t={t}
          />
        ))}
      </div>

      {/* Show more / show less toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(prev => !prev)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/50"
        >
          {showAll
            ? t('planner.recentRides.showLess')
            : t('planner.recentRides.showMore', { count: history.length - VISIBLE_COUNT })}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>
      )}
    </div>
  )
}
