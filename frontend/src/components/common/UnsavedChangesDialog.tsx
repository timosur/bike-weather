import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface UnsavedChangesDialogProps {
  /** When true, shows save/discard/cancel options; when false shows leave/stay */
  canSave?: boolean
  onSave?: () => void
  onDiscard?: () => void
  onCancel?: () => void
  saving?: boolean
}

export function UnsavedChangesDialog({
  canSave = false,
  onSave,
  onDiscard,
  onCancel,
  saving = false,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 shadow-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
        </div>

        <h3
          className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('unsavedChanges.heading')}
        </h3>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {canSave ? t('unsavedChanges.textWithSave') : t('unsavedChanges.text')}
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {t('unsavedChanges.stay')}
          </button>
          {canSave && onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('common.loading') : t('unsavedChanges.saveAndLeave')}
            </button>
          )}
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
          >
            {canSave ? t('unsavedChanges.discard') : t('unsavedChanges.leave')}
          </button>
        </div>
      </div>
    </div>
  )
}
