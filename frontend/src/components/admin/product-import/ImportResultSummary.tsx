import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'

interface ImportResult {
  created: number
  updated: number
  errors: string[]
}

interface ImportResultSummaryProps {
  result: ImportResult
  onReset: () => void
}

export function ImportResultSummary({ result, onReset }: ImportResultSummaryProps) {
  const { t } = useTranslation()
  const hasErrors = result.errors.length > 0
  const total = result.created + result.updated

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${hasErrors ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
        {hasErrors ? (
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        )}
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {hasErrors
            ? t('admin.import.resultPartial', { total })
            : t('admin.import.resultSuccess', { total })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{result.created}</div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('admin.import.created')}</div>
        </div>
        <div className="text-center p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{result.updated}</div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('admin.import.updated')}</div>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">{t('admin.import.errors')}</p>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc list-inside">
            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            {t('admin.import.startNew')}
          </span>
        </button>
      </div>
    </div>
  )
}
