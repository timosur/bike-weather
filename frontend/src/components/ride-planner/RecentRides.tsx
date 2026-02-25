import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Bike, Trash2, BookmarkPlus, Check, Loader2, LogIn, ChevronDown, History } from 'lucide-react'
import type { RideHistoryEntry } from '../../hooks/useRideHistory'
import type { ConditionRating } from '../ride-report/types'
import { useAuth } from '../../contexts/AuthContext'
import { createRoute } from '../../api/routes'
import { useToast } from '../../hooks/useToast'

interface RecentRidesProps {
  history: RideHistoryEntry[]
  onSelect: (entry: RideHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
  onNavigateToLogin: () => void
}

const conditionColors: Record<ConditionRating, string> = {
  ideal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  good: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  caution: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'not-recommended': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

function RideCard({
  entry,
  onSelect,
  onRemove,
  onSaveRoute,
  onNavigateToLogin,
  saveState,
  isAuthenticated,
  formatDate,
  t,
}: {
  entry: RideHistoryEntry
  onSelect: (entry: RideHistoryEntry) => void
  onRemove: (id: string) => void
  onSaveRoute: (entry: RideHistoryEntry, e: React.MouseEvent) => void
  onNavigateToLogin: () => void
  saveState: 'idle' | 'saving' | 'saved'
  isAuthenticated: boolean
  formatDate: (ts: number) => string
  t: (key: string) => string
}) {
  const condition = entry.report.overallCondition
  return (
    <div
      onClick={() => onSelect(entry)}
      className="group bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-3 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
              {entry.report.startLocation || entry.rideInput.location?.address || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              {formatDate(entry.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <Bike className="w-3 h-3" strokeWidth={1.5} />
              {entry.rideInput.bikeType}
            </span>
            {entry.report.totalDistance > 0 && (
              <span>{entry.report.totalDistance} {entry.report.distanceUnit}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${conditionColors[condition]}`}>
            {t(`report.condition.${condition === 'not-recommended' ? 'notRecommended' : condition}`)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={(e) => onSaveRoute(entry, e)}
            disabled={saveState !== 'idle'}
            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${saveState === 'saved'
                ? 'text-emerald-600 dark:text-emerald-400'
                : saveState === 'saving'
                  ? 'text-stone-400 dark:text-stone-500'
                  : 'text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
          >
            {saveState === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
            {saveState === 'saved' && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
            {saveState === 'idle' && <BookmarkPlus className="w-3.5 h-3.5" strokeWidth={2} />}
            {saveState === 'saving'
              ? t('planner.recentRides.saving')
              : saveState === 'saved'
                ? t('planner.recentRides.saved')
                : t('planner.recentRides.saveToRoutes')}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigateToLogin() }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" strokeWidth={2} />
            {t('planner.recentRides.loginToSave')}
          </button>
        )}
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
  )
}

export function RecentRides({ history, onSelect, onRemove, onClear, onNavigateToLogin }: RecentRidesProps) {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { addToast } = useToast()
  const [saveStates, setSaveStates] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({})
  const [showAll, setShowAll] = useState(false)

  if (history.length === 0) return null

  const handleSaveRoute = async (entry: RideHistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    const state = saveStates[entry.id]
    if (state === 'saving' || state === 'saved') return

    setSaveStates(prev => ({ ...prev, [entry.id]: 'saving' }))
    try {
      await createRoute({
        name: entry.report.rideName,
        start_location: entry.report.startLocation,
        total_distance: entry.report.totalDistance,
        distance_unit: entry.report.distanceUnit,
        riding_style: entry.report.ridingStyle,
      })
      setSaveStates(prev => ({ ...prev, [entry.id]: 'saved' }))
      addToast(t('report.routeSaved'), 'success')
    } catch {
      setSaveStates(prev => ({ ...prev, [entry.id]: 'idle' }))
      addToast(t('report.routeSaveError'), 'error')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasMore = history.length > 1
  const visibleEntries = showAll ? history : history.slice(0, 1)

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

      {/* Always show the latest ride */}
      <div className="space-y-2">
        {visibleEntries.map(entry => (
          <RideCard
            key={entry.id}
            entry={entry}
            onSelect={onSelect}
            onRemove={onRemove}
            onSaveRoute={handleSaveRoute}
            onNavigateToLogin={onNavigateToLogin}
            saveState={saveStates[entry.id] ?? 'idle'}
            isAuthenticated={isAuthenticated}
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
            : t('planner.recentRides.showMore', { count: history.length - 1 })}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>
      )}
    </div>
  )
}
