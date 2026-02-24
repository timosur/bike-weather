import { CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EquipmentItem } from './types'

interface EquipmentListProps {
  items: EquipmentItem[]
}

export function EquipmentList({ items }: EquipmentListProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <h3
          className="text-sm font-semibold text-stone-900 dark:text-stone-100"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('report.equipment.heading')}
        </h3>
      </div>
      <ul className="divide-y divide-stone-100 dark:divide-stone-800">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-5 py-3">
            <CircleCheck
              className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0"
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.name}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
