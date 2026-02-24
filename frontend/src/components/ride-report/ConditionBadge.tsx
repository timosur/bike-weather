import { useTranslation } from 'react-i18next'
import type { ConditionRating } from './types'

const conditionConfig: Record<ConditionRating, { key: string; bg: string; text: string; dot: string }> = {
  ideal: {
    key: 'report.condition.ideal',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  good: {
    key: 'report.condition.good',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  caution: {
    key: 'report.condition.caution',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  'not-recommended': {
    key: 'report.condition.notRecommended',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
}

interface ConditionBadgeProps {
  condition: ConditionRating
  size?: 'sm' | 'md'
}

export function ConditionBadge({ condition, size = 'md' }: ConditionBadgeProps) {
  const { t } = useTranslation()
  const config = conditionConfig[condition]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t(config.key)}
    </span>
  )
}
