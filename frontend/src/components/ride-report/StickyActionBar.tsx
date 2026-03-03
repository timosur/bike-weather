import { useTranslation } from 'react-i18next'
import { Share2, Bookmark, BookmarkCheck, PenLine, Plus, Save, Check, Loader2 } from 'lucide-react'

interface StickyActionBarProps {
  onEditRide?: () => void
  onNewRide?: () => void
  onShare?: () => void
  shareLoading?: boolean
  onSaveRoute?: () => void
  routeSaving?: boolean
  routeSaved?: boolean
  onLoginToSave?: () => void
  onSaveChanges?: () => void
  saveChangesLoading?: boolean
  hasUnsavedChanges?: boolean
}

export function StickyActionBar({
  onEditRide,
  onNewRide,
  onShare,
  shareLoading,
  onSaveRoute,
  routeSaving,
  routeSaved,
  onLoginToSave,
  onSaveChanges,
  saveChangesLoading,
  hasUnsavedChanges,
}: StickyActionBarProps) {
  const { t } = useTranslation()

  const hasAnyAction = onEditRide || onNewRide || onShare || onSaveRoute || onLoginToSave || onSaveChanges
  if (!hasAnyAction) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4 pb-4 pt-2">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-lg ring-1 ring-stone-200/60 dark:ring-stone-700/60 shadow-lg">
          {onEditRide && (
            <button
              onClick={onEditRide}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <PenLine className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('planner.editRide')}</span>
            </button>
          )}
          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              disabled={saveChangesLoading || !hasUnsavedChanges}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${!hasUnsavedChanges
                ? 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 cursor-default'
                : saveChangesLoading
                  ? 'text-white bg-emerald-600/70 cursor-wait'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
            >
              {saveChangesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : hasUnsavedChanges ? (
                <Save className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Check className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">
                {saveChangesLoading
                  ? t('report.savingChanges')
                  : hasUnsavedChanges
                    ? t('report.saveChanges')
                    : t('report.noChanges')}
              </span>
            </button>
          )}
          {onNewRide && (
            <button
              onClick={onNewRide}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('report.newRide')}</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare?.()}
              disabled={shareLoading}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${shareLoading ? 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 cursor-wait' : 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            >
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{shareLoading ? t('report.sharing') : t('report.share')}</span>
            </button>
          )}
          {onSaveRoute && (
            <button
              onClick={() => onSaveRoute()}
              disabled={routeSaving || routeSaved}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${routeSaved
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 cursor-default'
                : routeSaving
                  ? 'text-white bg-emerald-600/70 cursor-wait'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
            >
              {routeSaved ? (
                <BookmarkCheck className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">
                {routeSaved ? t('report.saved') : routeSaving ? t('report.saving') : t('report.save')}
              </span>
            </button>
          )}
          {!onSaveRoute && onLoginToSave && (
            <button
              onClick={() => onLoginToSave()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('report.loginToSave')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
