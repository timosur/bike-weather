import { CircleCheck, ShieldCheck, Droplets, Wrench, Cookie } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EquipmentItem } from './types'

const CATEGORY_ORDER = ['safety', 'hydration', 'gear', 'tools', 'nutrition'] as const

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const cls = className ?? 'w-4 h-4'
  const sw = 1.5
  switch (category) {
    case 'safety':
      return <ShieldCheck className={cls} strokeWidth={sw} />
    case 'hydration':
      return <Droplets className={cls} strokeWidth={sw} />
    case 'tools':
      return <Wrench className={cls} strokeWidth={sw} />
    case 'nutrition':
      return <Cookie className={cls} strokeWidth={sw} />
    default:
      return <CircleCheck className={cls} strokeWidth={sw} />
  }
}

interface EquipmentListProps {
  items: EquipmentItem[]
}

export function EquipmentList({ items }: EquipmentListProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  // Group items by category
  const grouped = new Map<string, EquipmentItem[]>()
  for (const item of items) {
    const cat = item.category ?? 'gear'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  // Sort groups by defined order
  const sortedCategories = [...grouped.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a as typeof CATEGORY_ORDER[number]) - CATEGORY_ORDER.indexOf(b as typeof CATEGORY_ORDER[number])
  )

  const categoryColors: Record<string, string> = {
    safety: 'text-amber-400 dark:text-amber-500',
    hydration: 'text-blue-400 dark:text-blue-500',
    tools: 'text-stone-400 dark:text-stone-500',
    nutrition: 'text-orange-400 dark:text-orange-500',
    gear: 'text-emerald-400 dark:text-emerald-500',
  }

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden divide-y divide-stone-200 dark:divide-stone-800">
      {sortedCategories.map((cat) => (
        <div key={cat} className="py-1">
          <div className="px-5 pt-3 pb-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0" />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t(`report.equipment.category.${cat}`)}
            </span>
          </div>
          <ul>
            {grouped.get(cat)!.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-5 py-2.5">
                <CategoryIcon
                  category={cat}
                  className={`w-4 h-4 mt-0.5 shrink-0 ${categoryColors[cat] ?? 'text-stone-400'}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.reason}</p>
                  {item.contents && item.contents.length > 0 && (
                    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {item.contents.map((sub, idx) => (
                        <li key={idx} className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <span className="text-stone-300 dark:text-stone-600">•</span>
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
