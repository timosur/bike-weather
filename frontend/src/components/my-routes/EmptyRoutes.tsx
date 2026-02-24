import { MapPin, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EmptyRoutesProps {
  onNavigateToPlanner?: () => void
}

export function EmptyRoutes({ onNavigateToPlanner }: EmptyRoutesProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration placeholder */}
      <div className="w-20 h-20 mb-6 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <MapPin className="w-9 h-9 text-stone-300 dark:text-stone-600" strokeWidth={1.2} />
      </div>

      <h2
        className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {t('routes.empty.heading')}
      </h2>

      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mb-8 leading-relaxed">
        {t('routes.empty.text')}
      </p>

      <button
        onClick={() => onNavigateToPlanner?.()}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-colors"
      >
        {t('routes.empty.cta')}
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  )
}
