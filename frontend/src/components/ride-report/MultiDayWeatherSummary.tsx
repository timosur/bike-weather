import { useMemo } from 'react'
import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Calendar,
  CloudHail,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DayForecast } from './types'
import { WeatherIcon } from './WeatherIcon'
import { ConditionBadge } from './ConditionBadge'

interface MultiDayWeatherSummaryProps {
  days: DayForecast[]
}

interface WeatherStatProps {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
}

function WeatherStat({ icon, label, value, subValue }: WeatherStatProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-500 dark:text-stone-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{value}</p>
        {subValue && (
          <p className="text-xs text-stone-400 dark:text-stone-500">{subValue}</p>
        )}
      </div>
    </div>
  )
}

export function MultiDayWeatherSummary({ days }: MultiDayWeatherSummaryProps) {
  const { t } = useTranslation()

  const summary = useMemo(() => {
    if (days.length === 0) return null

    const allWeather = days.map(d => d.weather)
    const tempMinAll = Math.min(...allWeather.map(w => w.tempMin))
    const tempMaxAll = Math.max(...allWeather.map(w => w.tempMax))
    const precipMax = Math.max(...allWeather.map(w => w.precipitation))
    const windMax = Math.max(...allWeather.map(w => w.windSpeed))
    const humidityMax = Math.max(...allWeather.map(w => w.humidity))
    const uvMax = Math.max(...allWeather.map(w => w.uvIndex))
    const aqiMax = Math.max(...allWeather.map(w => w.airQualityIndex ?? 0))

    // Find the "worst" weather icon across days
    const iconPriority: Record<string, number> = {
      'thunderstorm': 6, 'snow': 5, 'rain': 4, 'fog': 3,
      'cloud': 2, 'cloud-sun': 1, 'sun': 0,
    }
    const worstIcon = allWeather.reduce((worst, w) =>
      (iconPriority[w.icon] ?? 0) > (iconPriority[worst.icon] ?? 0) ? w : worst
    )

    return {
      tempMinAll,
      tempMaxAll,
      precipMax,
      windMax,
      humidityMax,
      uvMax,
      aqiMax,
      worstIcon: worstIcon.icon,
      worstDescription: worstIcon.description,
      tempUnit: allWeather[0].tempUnit,
      windUnit: allWeather[0].windUnit,
      precipUnit: allWeather[0].precipitationUnit,
    }
  }, [days])

  if (!summary) return null

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
      {/* Hero section — aggregated temp range */}
      <div className="px-5 py-5 bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800/50 dark:to-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                {t('report.multiDay.allDays', { count: days.length })}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {summary.tempMaxAll}{summary.tempUnit}
              </span>
              <span className="text-lg text-stone-400 dark:text-stone-500 font-medium">
                / {summary.tempMinAll}{summary.tempUnit}
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 font-medium">
              {summary.worstDescription}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-amber-500">
            <WeatherIcon icon={summary.worstIcon} className="w-8 h-8" />
          </div>
        </div>

        {/* Per-day condition badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {days.map(day => (
            <div key={day.id} className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 dark:text-stone-400">{day.dayLabel}:</span>
              <ConditionBadge condition={day.condition} size="sm" reasons={day.conditionReasons} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid — worst-case across all days */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <WeatherStat
          icon={<Droplets className="w-4 h-4" />}
          label={t('report.weather.precipitation')}
          value={`${summary.precipMax}${summary.precipUnit}`}
          subValue={t('report.multiDay.worstCase')}
        />
        <WeatherStat
          icon={<Wind className="w-4 h-4" />}
          label={t('report.weather.wind')}
          value={`${summary.windMax} ${summary.windUnit}`}
          subValue={t('report.multiDay.worstCase')}
        />
        <WeatherStat
          icon={<Thermometer className="w-4 h-4" />}
          label={t('report.weather.humidity')}
          value={`${summary.humidityMax}%`}
        />
        <WeatherStat
          icon={<Eye className="w-4 h-4" />}
          label={t('report.weather.uvIndex')}
          value={`${summary.uvMax}`}
          subValue={summary.uvMax >= 6 ? t('report.weather.uvHigh') : summary.uvMax >= 3 ? t('report.weather.uvMedium') : t('report.weather.uvLow')}
        />
        <WeatherStat
          icon={<CloudHail className="w-4 h-4" />}
          label={t('report.weather.airQuality')}
          value={`${summary.aqiMax}`}
          subValue={
            summary.aqiMax > 100 ? t('report.weather.aqiExtreme')
              : summary.aqiMax > 80 ? t('report.weather.aqiVeryPoor')
                : summary.aqiMax > 60 ? t('report.weather.aqiPoor')
                  : summary.aqiMax > 40 ? t('report.weather.aqiModerate')
                    : summary.aqiMax > 20 ? t('report.weather.aqiFair')
                      : t('report.weather.aqiGood')
          }
        />
      </div>
    </div>
  )
}
