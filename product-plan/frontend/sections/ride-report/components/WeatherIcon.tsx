import { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning, CloudFog } from 'lucide-react'
import type { WeatherIcon as WeatherIconType } from '../types'

const iconMap: Record<WeatherIconType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  thunderstorm: CloudLightning,
  fog: CloudFog,
}

interface WeatherIconProps {
  icon: WeatherIconType
  className?: string
}

export function WeatherIcon({ icon, className = 'w-5 h-5' }: WeatherIconProps) {
  const Icon = iconMap[icon]
  return <Icon className={className} strokeWidth={1.5} />
}
