import { useTranslation } from 'react-i18next'
import type { DayForecast } from './types'
import { WeatherIcon } from './WeatherIcon'
import { ConditionBadge } from './ConditionBadge'

interface DayTabsProps {
  days: DayForecast[]
  activeDayId: string
  onDaySelect?: (dayId: string) => void
}

export function DayTabs({ days, activeDayId, onDaySelect }: DayTabsProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (days.length <= 1) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {days.map((day) => {
        const isActive = day.id === activeDayId
        return (
          <button
            key={day.id}
            onClick={() => onDaySelect?.(day.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${isActive
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
          >
            <WeatherIcon icon={day.weather.icon} className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span>{day.dayLabel}</span>
                <span className="text-stone-400 dark:text-stone-500 font-normal">{formatDate(day.date)}</span>
                {isActive && <ConditionBadge condition={day.condition} size="sm" reasons={day.conditionReasons} />}
              </div>
              {day.location && (
                <span className="text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {day.location}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
