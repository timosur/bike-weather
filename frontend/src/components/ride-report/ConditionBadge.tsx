import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import type { ConditionRating, ConditionReason } from './types'

const conditionConfig: Record<ConditionRating, { key: string; bg: string; text: string; dot: string; border: string; accent: string }> = {
  ideal: {
    key: 'report.condition.ideal',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'ring-emerald-200 dark:ring-emerald-800',
    accent: 'border-emerald-500',
  },
  good: {
    key: 'report.condition.good',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'ring-amber-200 dark:ring-amber-800',
    accent: 'border-amber-500',
  },
  caution: {
    key: 'report.condition.caution',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    border: 'ring-orange-200 dark:ring-orange-800',
    accent: 'border-orange-500',
  },
  'not-recommended': {
    key: 'report.condition.notRecommended',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'ring-red-200 dark:ring-red-800',
    accent: 'border-red-500',
  },
}

interface ConditionBadgeProps {
  condition: ConditionRating
  size?: 'sm' | 'md'
  reasons?: ConditionReason[]
}

export function ConditionBadge({ condition, size = 'md', reasons }: ConditionBadgeProps) {
  const { t } = useTranslation()
  const config = conditionConfig[condition]
  const hasReasons = reasons && reasons.length > 0

  // sm size or no reasons → compact pill only
  if (size === 'sm' || !hasReasons) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {t(config.key)}
      </span>
    )
  }

  // md size with reasons → always-visible card
  const descKey = `report.condition.${condition === 'not-recommended' ? 'notRecommended' : condition}Description`

  return (
    <div className={`rounded-xl border-l-4 ${config.accent} ${config.bg} ring-1 ${config.border} overflow-hidden h-full`}>
      <div className="px-4 py-3 space-y-2 h-full flex flex-col justify-center">
        {/* Badge pill + description */}
        <div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {t(config.key)}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 ml-1.5">
            — {t(descKey)}
          </span>
        </div>

        {/* Reasons list */}
        <ul className="space-y-1">
          {reasons!.map((r) => (
            <li key={r.code} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 mt-0.5">{r.emoji}</span>
              <div>
                <span className="font-medium text-stone-700 dark:text-stone-300">{r.label}</span>
                {r.detail && (
                  <span className="text-stone-500 dark:text-stone-400 ml-1">{r.detail}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
