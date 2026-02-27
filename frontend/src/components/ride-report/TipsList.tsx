import { AlertTriangle, Info } from 'lucide-react'
import type { Tip } from './types'

interface TipsListProps {
  tips: Tip[]
}

const severityConfig: Record<string, {
  border: string
  bg: string
  iconColor: string
  Icon: typeof AlertTriangle
}> = {
  warning: {
    border: 'border-amber-400 dark:border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-500 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-sky-400 dark:border-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    iconColor: 'text-sky-500 dark:text-sky-400',
    Icon: Info,
  },
  danger: {
    border: 'border-red-400 dark:border-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-500 dark:text-red-400',
    Icon: AlertTriangle,
  },
}

const defaultConfig = severityConfig.info

const categoryColors: Record<string, string> = {
  heat: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  rain: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  comfort: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  safety: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

const defaultCategoryColor = 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'

export function TipsList({ tips }: TipsListProps) {
  if (!tips.length) return null

  return (
    <div className="space-y-2">
      {tips.map((tip) => {
        const config = severityConfig[tip.severity] ?? defaultConfig
        const { Icon } = config
        const catColor = categoryColors[tip.category] ?? defaultCategoryColor

        return (
          <div
            key={tip.id}
            className={`flex items-start gap-3 rounded-xl border-l-4 ${config.border} ${config.bg} p-3.5`}
          >
            <Icon className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${config.iconColor}`} strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider mb-1 ${catColor}`}
              >
                {tip.category}
              </span>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {tip.message}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
