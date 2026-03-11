import { useMemo, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sunrise, Sunset } from 'lucide-react'
import type { DayForecast, HourlyWeather } from './types'

interface MultiDayWeatherChartProps {
  days: DayForecast[]
  /** Ref callback: provides scroll-to-day functionality to parent */
  onChartRef?: (ref: HTMLDivElement | null) => void
}

// Chart layout constants
const WIDTH_PER_DAY = 600
const CHART_HEIGHT = 210
const PADDING = { top: 28, right: 45, bottom: 28, left: 40 }
const PLOT_H = CHART_HEIGHT - PADDING.top - PADDING.bottom

function buildPath(points: { x: number; y: number }[], smooth = true): string {
  if (points.length < 2) return ''
  if (!smooth) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  }
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

function parseTimeToHours(time: string): number | null {
  const m = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60
}

/** Flatten all hourly data from all days into a continuous dataset */
interface FlatHour {
  /** Continuous index for x-axis positioning */
  globalIdx: number
  /** Which day (0-based) this hour belongs to */
  dayIdx: number
  hour: number
  data: HourlyWeather
}

export function MultiDayWeatherChart({ days, onChartRef }: MultiDayWeatherChartProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'

  const chartData = useMemo(() => {
    if (!days || days.length === 0) return null

    // Flatten all hourly forecasts across days
    const flatHours: FlatHour[] = []
    let globalIdx = 0
    const dayBoundaries: { startIdx: number; endIdx: number; day: DayForecast; dayIdx: number }[] = []

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx]
      const hourly = day.hourlyForecast ?? []
      if (hourly.length === 0) continue

      const startIdx = globalIdx
      for (const h of hourly) {
        const hourNum = parseInt(h.hour.split(':')[0], 10)
        flatHours.push({ globalIdx, dayIdx, hour: hourNum, data: h })
        globalIdx++
      }
      dayBoundaries.push({ startIdx, endIdx: globalIdx - 1, day, dayIdx })
    }

    if (flatHours.length === 0) return null

    const totalPoints = flatHours.length
    const CHART_WIDTH = PADDING.left + PADDING.right + Math.max(totalPoints * 38, WIDTH_PER_DAY * days.length)
    const PLOT_W = CHART_WIDTH - PADDING.left - PADDING.right

    // Extract arrays
    const temps = flatHours.map(h => h.data.temp)
    const feelsLike = flatHours.map(h => h.data.tempFeelsLike)
    const precip = flatHours.map(h => h.data.precipitationProbability)
    const wind = flatHours.map(h => h.data.windSpeed)
    const isDay = flatHours.map(h => h.data.isDay)
    const uvIndex = flatHours.map(h => h.data.uvIndex ?? 0)
    const aqi = flatHours.map(h => h.data.airQualityIndex ?? 0)

    // Temperature scale
    const allTemps = [...temps, ...feelsLike]
    const tempMin = Math.floor(Math.min(...allTemps) / 2) * 2 - 2
    const tempMax = Math.ceil(Math.max(...allTemps) / 2) * 2 + 2

    // Scales
    const xScale = (idx: number) =>
      PADDING.left + (idx / Math.max(totalPoints - 1, 1)) * PLOT_W
    const tempScale = (val: number) =>
      PADDING.top + PLOT_H - ((val - tempMin) / Math.max(tempMax - tempMin, 1)) * PLOT_H
    const precipScale = (val: number) =>
      PADDING.top + PLOT_H - (val / 100) * PLOT_H
    const windScale = (val: number) => {
      const maxWind = Math.max(50, ...wind)
      return PADDING.top + PLOT_H - (val / maxWind) * PLOT_H
    }
    const uvScale = (val: number) => {
      const maxUv = Math.max(12, ...uvIndex)
      return PADDING.top + PLOT_H - (val / maxUv) * PLOT_H
    }
    const aqiScale = (val: number) => {
      const maxAqi = Math.max(100, ...aqi)
      return PADDING.top + PLOT_H - (val / maxAqi) * PLOT_H
    }

    const tempPoints = flatHours.map((_, i) => ({ x: xScale(i), y: tempScale(temps[i]) }))
    const feelsPoints = flatHours.map((_, i) => ({ x: xScale(i), y: tempScale(feelsLike[i]) }))
    const windPoints = flatHours.map((_, i) => ({ x: xScale(i), y: windScale(wind[i]) }))
    const uvPoints = flatHours.map((_, i) => ({ x: xScale(i), y: uvScale(uvIndex[i]) }))
    const aqiPoints = flatHours.map((_, i) => ({ x: xScale(i), y: aqiScale(aqi[i]) }))

    // Temp Y-axis ticks
    const tempTicks: number[] = []
    const step = tempMax - tempMin > 20 ? 5 : tempMax - tempMin > 10 ? 4 : 2
    for (let v = Math.ceil(tempMin / step) * step; v <= tempMax; v += step) {
      tempTicks.push(v)
    }

    // Per-day ride windows & sunrise/sunset
    const dayMeta = dayBoundaries.map(({ startIdx, endIdx, day }) => {
      const rideX0 = day.rideStartHour != null
        ? (() => {
          const match = flatHours.findIndex((h, i) => i >= startIdx && i <= endIdx && h.hour === day.rideStartHour)
          return match >= 0 ? xScale(match) : null
        })()
        : null
      const rideX1 = day.rideEndHour != null
        ? (() => {
          // Find last hour <= rideEndHour within this day
          let lastMatch = -1
          for (let i = startIdx; i <= endIdx; i++) {
            if (flatHours[i].hour <= day.rideEndHour!) lastMatch = i
          }
          return lastMatch >= 0 ? xScale(lastMatch) : null
        })()
        : null
      const sunriseH = day.weather.sunrise ? parseTimeToHours(day.weather.sunrise) : null
      const sunsetH = day.weather.sunset ? parseTimeToHours(day.weather.sunset) : null

      // Map sunrise/sunset to x positions within this day's range
      const sunriseX = sunriseH != null
        ? (() => {
          const match = flatHours.findIndex((h, i) => i >= startIdx && i <= endIdx && h.hour >= Math.floor(sunriseH))
          return match >= 0 ? xScale(match) : null
        })()
        : null
      const sunsetX = sunsetH != null
        ? (() => {
          const match = flatHours.findIndex((h, i) => i >= startIdx && i <= endIdx && h.hour >= Math.floor(sunsetH))
          return match >= 0 ? xScale(match) : null
        })()
        : null

      return {
        startX: xScale(startIdx),
        endX: xScale(endIdx),
        rideX0,
        rideX1,
        sunriseX,
        sunsetX,
        sunriseH,
        sunsetH,
        sunrise: day.weather.sunrise,
        sunset: day.weather.sunset,
      }
    })

    return {
      flatHours,
      temps,
      feelsLike,
      precip,
      wind,
      isDay,
      uvIndex,
      aqi,
      tempMin,
      tempMax,
      xScale,
      tempScale,
      precipScale,
      windScale,
      uvScale,
      aqiScale,
      tempPoints,
      feelsPoints,
      windPoints,
      uvPoints,
      aqiPoints,
      tempTicks,
      dayBoundaries,
      dayMeta,
      CHART_WIDTH,
      PLOT_W,
      totalPoints,
    }
  }, [days])

  // Hover state
  const svgRef = useRef<SVGSVGElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chartData || !svgRef.current) return
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      const svgX = ((e.clientX - rect.left) / rect.width) * chartData.CHART_WIDTH
      let closest = 0
      let closestDist = Infinity
      for (let i = 0; i < chartData.flatHours.length; i++) {
        const px = chartData.xScale(i)
        const dist = Math.abs(svgX - px)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      }
      setHoverIdx(closest)
    },
    [chartData],
  )

  const handleMouseLeave = useCallback(() => setHoverIdx(null), [])

  // Combine refs for scrolling
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      onChartRef?.(el)
    },
    [onChartRef],
  )

  if (!chartData) return null

  const {
    flatHours,
    tempPoints,
    feelsPoints,
    windPoints,
    uvPoints,
    aqiPoints,
    tempTicks,
    dayBoundaries,
    dayMeta,
    CHART_WIDTH,
    PLOT_W,
    xScale,
    tempScale,
  } = chartData

  const barW = Math.max(4, PLOT_W / flatHours.length * 0.6)

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {t('report.multiDay.weatherTimeline')}
        </p>
      </div>
      <div ref={setRefs} className="px-2 pb-3 overflow-x-auto scrollbar-thin max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          className="h-auto"
          style={{ minWidth: `${CHART_WIDTH}px` }}
          role="img"
          aria-label={t('report.multiDay.weatherTimeline')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          cursor={hoverIdx != null ? 'crosshair' : undefined}
        >
          <defs>
            <linearGradient id="md-rideWindowGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="md-tempFillGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(245,158,11)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
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

          {/* Day separator lines & labels */}
          {dayBoundaries.map(({ startIdx, day, dayIdx }, i) => {
            const x = xScale(startIdx)
            return (
              <g key={`day-sep-${dayIdx}`} data-day-id={day.id}>
                {/* Vertical separator line (not for first day) */}
                {i > 0 && (
                  <line
                    x1={x - 8}
                    x2={x - 8}
                    y1={PADDING.top - 4}
                    y2={PADDING.top + PLOT_H}
                    className="stroke-stone-300 dark:stroke-stone-600"
                    strokeWidth={1.5}
                    strokeDasharray="6,4"
                  />
                )}
                {/* Day label at top */}
                <text
                  x={x + 4}
                  y={PADDING.top - 10}
                  className="fill-stone-600 dark:fill-stone-300"
                  style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}
                >
                  {day.dayLabel} — {formatDate(day.date)}
                  {day.location ? ` · ${day.location}` : ''}
                </text>
              </g>
            )
          })}

          {/* Night shading per day */}
          {dayMeta.map((meta, i) => {
            const boundary = dayBoundaries[i]
            if (!meta.sunriseX || !meta.sunsetX) return null
            const dayStartX = xScale(boundary.startIdx)
            const dayEndX = xScale(boundary.endIdx)

            return (
              <g key={`night-${i}`}>
                {/* Pre-sunrise shading */}
                {meta.sunriseX > dayStartX && (
                  <rect
                    x={dayStartX}
                    y={PADDING.top}
                    width={meta.sunriseX - dayStartX}
                    height={PLOT_H}
                    className="fill-stone-900/[0.06] dark:fill-stone-400/[0.06]"
                  />
                )}
                {/* Post-sunset shading */}
                {meta.sunsetX < dayEndX && (
                  <rect
                    x={meta.sunsetX}
                    y={PADDING.top}
                    width={dayEndX - meta.sunsetX}
                    height={PLOT_H}
                    className="fill-stone-900/[0.06] dark:fill-stone-400/[0.06]"
                  />
                )}
              </g>
            )
          })}

          {/* Sunrise/sunset markers per day */}
          {dayMeta.map((meta, i) => (
            <g key={`sun-markers-${i}`}>
              {meta.sunriseX != null && (
                <>
                  <line
                    x1={meta.sunriseX} x2={meta.sunriseX}
                    y1={PADDING.top} y2={PADDING.top + PLOT_H}
                    className="stroke-amber-400/60 dark:stroke-amber-300/40"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  {meta.sunrise && (
                    <foreignObject
                      x={meta.sunriseX - 16}
                      y={PADDING.top + PLOT_H + 2}
                      width={32}
                      height={18}
                      style={{ overflow: 'visible' }}
                    >
                      <div className="flex flex-col items-center">
                        <Sunrise className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      </div>
                    </foreignObject>
                  )}
                </>
              )}
              {meta.sunsetX != null && (
                <>
                  <line
                    x1={meta.sunsetX} x2={meta.sunsetX}
                    y1={PADDING.top} y2={PADDING.top + PLOT_H}
                    className="stroke-amber-400/60 dark:stroke-amber-300/40"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  {meta.sunset && (
                    <foreignObject
                      x={meta.sunsetX - 16}
                      y={PADDING.top + PLOT_H + 2}
                      width={32}
                      height={18}
                      style={{ overflow: 'visible' }}
                    >
                      <div className="flex flex-col items-center">
                        <Sunset className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      </div>
                    </foreignObject>
                  )}
                </>
              )}
            </g>
          ))}

          {/* Ride window highlights per day */}
          {dayMeta.map((meta, i) => {
            if (meta.rideX0 == null || meta.rideX1 == null || meta.rideX1 <= meta.rideX0) return null
            return (
              <g key={`ride-${i}`}>
                <rect
                  x={meta.rideX0}
                  y={PADDING.top}
                  width={meta.rideX1 - meta.rideX0}
                  height={PLOT_H}
                  fill="url(#md-rideWindowGrad)"
                  rx={4}
                />
                <line
                  x1={meta.rideX0} x2={meta.rideX0}
                  y1={PADDING.top} y2={PADDING.top + PLOT_H}
                  className="stroke-emerald-500 dark:stroke-emerald-400"
                  strokeWidth={1.5}
                  strokeDasharray="4,3"
                />
                <line
                  x1={meta.rideX1} x2={meta.rideX1}
                  y1={PADDING.top} y2={PADDING.top + PLOT_H}
                  className="stroke-emerald-500 dark:stroke-emerald-400"
                  strokeWidth={1.5}
                  strokeDasharray="4,3"
                />
              </g>
            )
          })}

          {/* Precipitation bars */}
          {flatHours.map((fh, i) => {
            const val = fh.data.precipitationProbability
            if (val <= 0) return null
            const barH = (val / 100) * PLOT_H
            const x = xScale(i) - barW / 2
            const y = PADDING.top + PLOT_H - barH
            return (
              <rect
                key={`precip-${i}`}
                x={x} y={y}
                width={barW} height={barH}
                rx={2}
                className="fill-blue-300/50 dark:fill-blue-500/30"
              />
            )
          })}

          {/* Temperature area fill */}
          {tempPoints.length > 1 && (
            <path
              d={
                buildPath(tempPoints) +
                ` L${tempPoints[tempPoints.length - 1].x},${PADDING.top + PLOT_H}` +
                ` L${tempPoints[0].x},${PADDING.top + PLOT_H} Z`
              }
              fill="url(#md-tempFillGrad)"
            />
          )}

          {/* Wind line */}
          <path
            d={buildPath(windPoints)}
            fill="none"
            className="stroke-stone-400 dark:stroke-stone-500"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.6}
          />

          {/* UV index line */}
          <path
            d={buildPath(uvPoints)}
            fill="none"
            className="stroke-purple-500 dark:stroke-purple-400"
            strokeWidth={1.5}
            strokeDasharray="3,2"
            opacity={0.7}
          />

          {/* Air quality index line */}
          <path
            d={buildPath(aqiPoints)}
            fill="none"
            className="stroke-teal-500 dark:stroke-teal-400"
            strokeWidth={1.5}
            strokeDasharray="2,2"
            opacity={0.7}
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
              cx={p.x} cy={p.y}
              r={2}
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

          {/* X-axis labels (every 3 hours within each day) */}
          {flatHours.map((fh, i) => {
            if (fh.hour % 3 !== 0) return null
            return (
              <text
                key={`x-${i}`}
                x={xScale(i)}
                y={PADDING.top + PLOT_H + 16}
                textAnchor="middle"
                className="fill-stone-400 dark:fill-stone-500"
                style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {fh.hour}:00
              </text>
            )
          })}

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

          {/* Hover crosshair + tooltip */}
          {hoverIdx != null && (() => {
            const hx = xScale(hoverIdx)
            const fh = flatHours[hoverIdx]
            const displayHour = `${fh.hour}:00`
            const dayLabel = days[fh.dayIdx]?.dayLabel ?? ''
            const temp = fh.data.temp
            const feels = fh.data.tempFeelsLike
            const prec = fh.data.precipitationProbability
            const wnd = fh.data.windSpeed
            const uv = chartData.uvIndex[hoverIdx]
            const aqiVal = chartData.aqi[hoverIdx]
            const tw = 140
            const th = 119
            const tp = 8
            const tooltipX = hx + tw + tp > CHART_WIDTH - PADDING.right
              ? hx - tw - tp
              : hx + tp
            const tooltipY = PADDING.top + 4
            return (
              <>
                <line
                  x1={hx} x2={hx}
                  y1={PADDING.top} y2={PADDING.top + PLOT_H}
                  className="stroke-stone-400 dark:stroke-stone-500"
                  strokeWidth={0.75}
                  strokeDasharray="2,2"
                  pointerEvents="none"
                />
                <circle cx={hx} cy={tempPoints[hoverIdx].y} r={3.5}
                  className="fill-amber-500 dark:fill-amber-400 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={feelsPoints[hoverIdx].y} r={3}
                  className="fill-blue-400 dark:fill-blue-500 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={windPoints[hoverIdx].y} r={3}
                  className="fill-stone-400 dark:fill-stone-500 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={uvPoints[hoverIdx].y} r={3}
                  className="fill-purple-500 dark:fill-purple-400 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={aqiPoints[hoverIdx].y} r={3}
                  className="fill-teal-500 dark:fill-teal-400 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <rect
                  x={tooltipX} y={tooltipY}
                  width={tw} height={th}
                  rx={6}
                  className="fill-white dark:fill-stone-800 stroke-stone-200 dark:stroke-stone-700"
                  strokeWidth={0.5}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
                  pointerEvents="none"
                />
                <text x={tooltipX + 8} y={tooltipY + 13} style={{ fontSize: 9, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-stone-500 dark:fill-stone-400" pointerEvents="none">
                  {dayLabel}
                </text>
                <text x={tooltipX + 8} y={tooltipY + 27} style={{ fontSize: 10, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-stone-700 dark:fill-stone-200" pointerEvents="none">
                  {displayHour}
                </text>
                <text x={tooltipX + 8} y={tooltipY + 42} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-amber-600 dark:fill-amber-400" pointerEvents="none">
                  {t('report.weather.legend.temp')}: {temp.toFixed(1)}°
                </text>
                <text x={tooltipX + 8} y={tooltipY + 55} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-blue-500 dark:fill-blue-400" pointerEvents="none">
                  {t('report.weather.legend.feelsLike')}: {feels.toFixed(1)}°
                </text>
                <text x={tooltipX + 8} y={tooltipY + 68} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-blue-400 dark:fill-blue-500" pointerEvents="none">
                  {t('report.weather.legend.precip')}: {prec.toFixed(0)}%
                </text>
                <text x={tooltipX + 8} y={tooltipY + 81} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-stone-500 dark:fill-stone-400" pointerEvents="none">
                  {t('report.weather.legend.wind')}: {wnd.toFixed(1)} km/h
                </text>
                <text x={tooltipX + 8} y={tooltipY + 94} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-purple-500 dark:fill-purple-400" pointerEvents="none">
                  {t('report.weather.legend.uvIndex')}: {uv.toFixed(1)}
                </text>
                <text x={tooltipX + 8} y={tooltipY + 107} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-teal-500 dark:fill-teal-400" pointerEvents="none">
                  {t('report.weather.legend.airQuality')}: {aqiVal.toFixed(0)}
                </text>
              </>
            )
          })()}
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
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500 dark:bg-purple-400 rounded-full" style={{ borderBottom: '1px dashed' }} />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.uvIndex')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-full" style={{ borderBottom: '1px dotted' }} />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.airQuality')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-dashed border-emerald-500 rounded-sm" />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.rideWindow')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ borderBottom: '1.5px dashed rgb(252,211,77)' }} />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.sunrise')} / {t('report.weather.sunset')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-stone-900/[0.06] dark:bg-stone-400/[0.06] rounded-sm" />
            <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.chart.twilight')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
