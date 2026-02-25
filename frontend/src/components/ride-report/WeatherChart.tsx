import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { HourlyWeather } from './types'

interface WeatherChartProps {
  hourlyForecast: HourlyWeather[]
  rideStartHour?: number
  rideEndHour?: number
}

// Chart layout constants
const CHART_WIDTH = 720
const CHART_HEIGHT = 200
const PADDING = { top: 20, right: 45, bottom: 28, left: 40 }
const PLOT_W = CHART_WIDTH - PADDING.left - PADDING.right
const PLOT_H = CHART_HEIGHT - PADDING.top - PADDING.bottom

function buildPath(points: { x: number; y: number }[], smooth = true): string {
  if (points.length < 2) return ''
  if (!smooth) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  }
  // Catmull-Rom → cubic Bézier for smooth curves
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

export function WeatherChart({ hourlyForecast, rideStartHour, rideEndHour }: WeatherChartProps) {
  const { t } = useTranslation()

  const data = useMemo(() => {
    if (!hourlyForecast || hourlyForecast.length === 0) return null

    const hours = hourlyForecast.map(h => parseInt(h.hour.split(':')[0], 10))
    const temps = hourlyForecast.map(h => h.temp)
    const feelsLike = hourlyForecast.map(h => h.tempFeelsLike)
    const precip = hourlyForecast.map(h => h.precipitationProbability)
    const wind = hourlyForecast.map(h => h.windSpeed)

    // Temperature scale (shared for temp + feels-like)
    const allTemps = [...temps, ...feelsLike]
    const tempMin = Math.floor(Math.min(...allTemps) / 2) * 2 - 2
    const tempMax = Math.ceil(Math.max(...allTemps) / 2) * 2 + 2

    const minHour = Math.min(...hours)
    const maxHour = Math.max(...hours)

    const xScale = (hour: number) =>
      PADDING.left + ((hour - minHour) / Math.max(maxHour - minHour, 1)) * PLOT_W
    const tempScale = (val: number) =>
      PADDING.top + PLOT_H - ((val - tempMin) / Math.max(tempMax - tempMin, 1)) * PLOT_H
    const precipScale = (val: number) =>
      PADDING.top + PLOT_H - (val / 100) * PLOT_H
    const windScale = (val: number) => {
      const maxWind = Math.max(50, ...wind)
      return PADDING.top + PLOT_H - (val / maxWind) * PLOT_H
    }

    const tempPoints = hours.map((h, i) => ({ x: xScale(h), y: tempScale(temps[i]) }))
    const feelsPoints = hours.map((h, i) => ({ x: xScale(h), y: tempScale(feelsLike[i]) }))
    const precipPoints = hours.map((h, i) => ({ x: xScale(h), y: precipScale(precip[i]) }))
    const windPoints = hours.map((h, i) => ({ x: xScale(h), y: windScale(wind[i]) }))

    // Ride window highlight
    const rideX0 = rideStartHour != null ? xScale(rideStartHour) : null
    const rideX1 = rideEndHour != null ? xScale(rideEndHour) : null

    // Y-axis ticks for temperature
    const tempTicks: number[] = []
    const step = tempMax - tempMin > 20 ? 5 : tempMax - tempMin > 10 ? 4 : 2
    for (let v = Math.ceil(tempMin / step) * step; v <= tempMax; v += step) {
      tempTicks.push(v)
    }

    // X-axis ticks (every 3 hours)
    const xTicks = hours.filter(h => h % 3 === 0)

    return {
      hours, temps, feelsLike, precip, wind,
      tempMin, tempMax, minHour, maxHour,
      xScale, tempScale, precipScale, windScale,
      tempPoints, feelsPoints, precipPoints, windPoints,
      rideX0, rideX1, tempTicks, xTicks,
    }
  }, [hourlyForecast, rideStartHour, rideEndHour])

  if (!data) return null

  const { rideX0, rideX1, tempPoints, feelsPoints, windPoints, tempTicks, xTicks, xScale, tempScale } = data

  // Precip bar width
  const barW = Math.max(4, PLOT_W / data.hours.length * 0.6)

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {t('report.weather.dailyForecast')}
        </p>
      </div>
      <div className="px-2 pb-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto min-w-[480px]"
          role="img"
          aria-label={t('report.weather.dailyForecast')}
        >
          <defs>
            <linearGradient id="rideWindowGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="tempFillGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(245,158,11)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {tempTicks.map(v => (
            <line
              key={`grid-${v}`}
              x1={PADDING.left}
              x2={PADDING.left + PLOT_W}
              y1={tempScale(v)}
              y2={tempScale(v)}
              className="stroke-stone-200 dark:stroke-stone-800"
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          ))}

          {/* Ride window highlight */}
          {rideX0 != null && rideX1 != null && rideX1 > rideX0 && (
            <>
              <rect
                x={rideX0}
                y={PADDING.top}
                width={rideX1 - rideX0}
                height={PLOT_H}
                fill="url(#rideWindowGrad)"
                rx={4}
              />
              <line
                x1={rideX0} x2={rideX0}
                y1={PADDING.top} y2={PADDING.top + PLOT_H}
                className="stroke-emerald-500 dark:stroke-emerald-400"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <line
                x1={rideX1} x2={rideX1}
                y1={PADDING.top} y2={PADDING.top + PLOT_H}
                className="stroke-emerald-500 dark:stroke-emerald-400"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
            </>
          )}
          {/* Single start-time marker when no range */}
          {rideX0 != null && (rideX1 == null || rideX1 <= rideX0) && (
            <line
              x1={rideX0} x2={rideX0}
              y1={PADDING.top} y2={PADDING.top + PLOT_H}
              className="stroke-emerald-500 dark:stroke-emerald-400"
              strokeWidth={2}
            />
          )}

          {/* Precipitation bars */}
          {data.hours.map((h, i) => {
            const val = data.precip[i]
            if (val <= 0) return null
            const barH = (val / 100) * PLOT_H
            const x = xScale(h) - barW / 2
            const y = PADDING.top + PLOT_H - barH
            return (
              <rect
                key={`precip-${h}`}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                className="fill-blue-300/50 dark:fill-blue-500/30"
              />
            )
          })}

          {/* Temperature area fill */}
          <path
            d={
              buildPath(tempPoints) +
              ` L${tempPoints[tempPoints.length - 1].x},${PADDING.top + PLOT_H}` +
              ` L${tempPoints[0].x},${PADDING.top + PLOT_H} Z`
            }
            fill="url(#tempFillGrad)"
          />

          {/* Wind line */}
          <path
            d={buildPath(windPoints)}
            fill="none"
            className="stroke-stone-400 dark:stroke-stone-500"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.6}
          />

          {/* Feels-like line */}
          <path
            d={buildPath(feelsPoints)}
            fill="none"
            className="stroke-blue-400 dark:stroke-blue-500"
            strokeWidth={1.5}
            strokeDasharray="4,2"
          />

          {/* Temperature line */}
          <path
            d={buildPath(tempPoints)}
            fill="none"
            className="stroke-amber-500 dark:stroke-amber-400"
            strokeWidth={2}
          />

          {/* Temperature dots */}
          {tempPoints.map((p, i) => (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={2.5}
              className="fill-amber-500 dark:fill-amber-400"
            />
          ))}

          {/* Y-axis labels (temperature) */}
          {tempTicks.map(v => (
            <text
              key={`y-${v}`}
              x={PADDING.left - 6}
              y={tempScale(v) + 3.5}
              textAnchor="end"
              className="fill-stone-400 dark:fill-stone-500"
              style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {v}°
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map(h => (
            <text
              key={`x-${h}`}
              x={xScale(h)}
              y={PADDING.top + PLOT_H + 16}
              textAnchor="middle"
              className="fill-stone-400 dark:fill-stone-500"
              style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {`${h}:00`}
            </text>
          ))}

          {/* Right-side axis label for precipitation */}
          <text
            x={PADDING.left + PLOT_W + 8}
            y={PADDING.top + 4}
            textAnchor="start"
            className="fill-blue-400 dark:fill-blue-500"
            style={{ fontSize: 8, fontFamily: 'IBM Plex Mono, monospace' }}
          >
            100%
          </text>
          <text
            x={PADDING.left + PLOT_W + 8}
            y={PADDING.top + PLOT_H + 3}
            textAnchor="start"
            className="fill-blue-400 dark:fill-blue-500"
            style={{ fontSize: 8, fontFamily: 'IBM Plex Mono, monospace' }}
          >
            0%
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.temp')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 rounded-full" style={{ borderBottom: '1px dashed' }} />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.feelsLike')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-300/50 dark:bg-blue-500/30 rounded-sm" />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.precip')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-stone-400 rounded-full" style={{ borderBottom: '1px dashed' }} />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.wind')}</span>
          </div>
          {(rideX0 != null) && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-dashed border-emerald-500 rounded-sm" />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.rideWindow')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
