import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WeatherData, HourlyWeather } from './types'
import { WeatherIcon } from './WeatherIcon'
import { WeatherChart } from './WeatherChart'

interface WeatherPanelProps {
  weather: WeatherData
  hourlyForecast?: HourlyWeather[]
  rideStartHour?: number
  rideEndHour?: number
  weatherSummary?: string
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

export function WeatherPanel({ weather, hourlyForecast, rideStartHour, rideEndHour, weatherSummary }: WeatherPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
      {/* Hero section */}
      <div className="px-5 py-5 bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800/50 dark:to-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {weather.tempMax}{weather.tempUnit}
              </span>
              <span className="text-lg text-stone-400 dark:text-stone-500 font-medium">
                / {weather.tempMin}{weather.tempUnit}
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('report.weather.feelsLike', { temp: weather.tempFeelsLike, unit: weather.tempUnit })}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 font-medium">
              {weather.description}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-amber-500">
            <WeatherIcon icon={weather.icon} className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Weather summary for ride window */}
      {weatherSummary && (
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
            {t('report.weather.summary')}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {weatherSummary}
          </p>
        </div>
      )}

      {/* Hourly forecast chart */}
      {hourlyForecast && hourlyForecast.length > 0 && (
        <WeatherChart
          hourlyForecast={hourlyForecast}
          rideStartHour={rideStartHour}
          rideEndHour={rideEndHour}
          sunrise={weather.sunrise}
          sunset={weather.sunset}
        />
      )}

      {/* Stats grid */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <WeatherStat
          icon={<Droplets className="w-4 h-4" />}
          label={t('report.weather.precipitation')}
          value={`${weather.precipitation}${weather.precipitationUnit}`}
        />
        <WeatherStat
          icon={<Wind className="w-4 h-4" />}
          label={t('report.weather.wind')}
          value={`${weather.windSpeed} ${weather.windUnit}`}
          subValue={t('report.weather.windFrom', { direction: weather.windDirection })}
        />
        <WeatherStat
          icon={<Thermometer className="w-4 h-4" />}
          label={t('report.weather.humidity')}
          value={`${weather.humidity}%`}
        />
        <WeatherStat
          icon={<Eye className="w-4 h-4" />}
          label={t('report.weather.uvIndex')}
          value={`${weather.uvIndex}`}
          subValue={weather.uvIndex >= 6 ? t('report.weather.uvHigh') : weather.uvIndex >= 3 ? t('report.weather.uvMedium') : t('report.weather.uvLow')}
        />
        <WeatherStat
          icon={<Sunrise className="w-4 h-4" />}
          label={t('report.weather.sunrise')}
          value={weather.sunrise}
        />
        <WeatherStat
          icon={<Sunset className="w-4 h-4" />}
          label={t('report.weather.sunset')}
          value={weather.sunset}
        />
      </div>
    </div>
  )
}
