import { useState } from 'react'
import { MapPin, CloudSun, Shirt, X, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'planner-onboarding-dismissed'

export function OnboardingHero() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* noop */ }
  }

  const steps = [
    { icon: MapPin, titleKey: 'planner.onboarding.step1Title', descKey: 'planner.onboarding.step1Desc' },
    { icon: CloudSun, titleKey: 'planner.onboarding.step2Title', descKey: 'planner.onboarding.step2Desc' },
    { icon: Shirt, titleKey: 'planner.onboarding.step3Title', descKey: 'planner.onboarding.step3Desc' },
  ]

  return (
    <div className="relative rounded-2xl border border-emerald-200/60 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 p-5 overflow-hidden">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        aria-label={t('planner.onboarding.dismiss')}
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>

      <p
        className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {t('planner.onboarding.title')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-left sm:text-center">
            <div className="flex items-center gap-2 sm:flex-col sm:gap-2">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <step.icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 hidden sm:hidden" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 leading-snug">
                {t(step.titleKey)}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                {t(step.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        {t('planner.onboarding.dismiss')}
      </button>
    </div>
  )
}
