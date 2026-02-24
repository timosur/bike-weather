import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
} from 'lucide-react'
import type { WeatherData } from './types'
import { WeatherIcon } from './WeatherIcon'

interface WeatherPanelProps {
  weather: WeatherData
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

export function WeatherPanel({ weather }: WeatherPanelProps) {
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
              Feels like {weather.tempFeelsLike}{weather.tempUnit}
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

      {/* Stats grid */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <WeatherStat
          icon={<Droplets className="w-4 h-4" />}
          label="Precipitation"
          value={`${weather.precipitation}${weather.precipitationUnit}`}
        />
        <WeatherStat
          icon={<Wind className="w-4 h-4" />}
          label="Wind"
          value={`${weather.windSpeed} ${weather.windUnit}`}
          subValue={`from ${weather.windDirection}`}
        />
        <WeatherStat
          icon={<Thermometer className="w-4 h-4" />}
          label="Humidity"
          value={`${weather.humidity}%`}
        />
        <WeatherStat
          icon={<Eye className="w-4 h-4" />}
          label="UV-Index"
          value={`${weather.uvIndex}`}
          subValue={weather.uvIndex >= 6 ? 'High' : weather.uvIndex >= 3 ? 'Medium' : 'Low'}
        />
        <WeatherStat
          icon={<Sunrise className="w-4 h-4" />}
          label="Sunrise"
          value={weather.sunrise}
        />
        <WeatherStat
          icon={<Sunset className="w-4 h-4" />}
          label="Sunset"
          value={weather.sunset}
        />
      </div>
    </div>
  )
}
