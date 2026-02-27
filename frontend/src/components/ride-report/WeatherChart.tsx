import { useMemo, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sunrise, Sunset } from 'lucide-react'
import type { HourlyWeather } from './types'

interface WeatherChartProps {
  hourlyForecast: HourlyWeather[]
  rideStartHour?: number
  rideEndHour?: number
  sunrise?: string
  sunset?: string
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

/** Parse "HH:MM" string into fractional hours (e.g. "06:30" → 6.5) */
function parseTimeToHours(time: string): number | null {
  const m = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60
}

export function WeatherChart({ hourlyForecast, rideStartHour, rideEndHour, sunrise, sunset }: WeatherChartProps) {
  const { t } = useTranslation()

  const data = useMemo(() => {
    if (!hourlyForecast || hourlyForecast.length === 0) return null

    const hours = hourlyForecast.map(h => parseInt(h.hour.split(':')[0], 10))
    const temps = hourlyForecast.map(h => h.temp)
    const feelsLike = hourlyForecast.map(h => h.tempFeelsLike)
    const precip = hourlyForecast.map(h => h.precipitationProbability)
    const wind = hourlyForecast.map(h => h.windSpeed)
    const isDay = hourlyForecast.map(h => h.isDay)

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

    // Light zone boundaries
    const TWILIGHT_OFFSET = 0.5 // 30 min in fractional hours
    const sunriseH = sunrise ? parseTimeToHours(sunrise) : null
    const sunsetH = sunset ? parseTimeToHours(sunset) : null

    // Clamp x-position to chart bounds
    const clampX = (x: number) => Math.max(PADDING.left, Math.min(PADDING.left + PLOT_W, x))

    let lightZones: {
      nightStartX: number | null // left edge of chart → morning twilight start
      morningTwilightX0: number | null // twilight start
      morningTwilightX1: number | null // sunrise (twilight end)
      sunriseX: number | null
      sunsetX: number | null
      eveningTwilightX0: number | null // sunset (twilight start)
      eveningTwilightX1: number | null // twilight end
      nightEndX: number | null // evening twilight end → right edge
    } = {
      nightStartX: null, morningTwilightX0: null, morningTwilightX1: null,
      sunriseX: null, sunsetX: null,
      eveningTwilightX0: null, eveningTwilightX1: null, nightEndX: null,
    }

    if (sunriseH != null && sunsetH != null) {
      const morningTwilightStart = sunriseH - TWILIGHT_OFFSET
      const eveningTwilightEnd = sunsetH + TWILIGHT_OFFSET

      // Ensure twilight zones don't overlap for very short days
      const safeMorningEnd = Math.min(sunriseH, sunsetH)
      const safeEveningStart = Math.max(sunriseH, sunsetH)

      lightZones = {
        nightStartX: clampX(xScale(minHour)),
        morningTwilightX0: clampX(xScale(Math.max(morningTwilightStart, minHour))),
        morningTwilightX1: clampX(xScale(Math.min(safeMorningEnd, maxHour))),
        sunriseX: sunriseH >= minHour && sunriseH <= maxHour ? clampX(xScale(sunriseH)) : null,
        sunsetX: sunsetH >= minHour && sunsetH <= maxHour ? clampX(xScale(sunsetH)) : null,
        eveningTwilightX0: clampX(xScale(Math.max(safeEveningStart, minHour))),
        eveningTwilightX1: clampX(xScale(Math.min(eveningTwilightEnd, maxHour))),
        nightEndX: clampX(xScale(maxHour)),
      }
    }

    return {
      hours, temps, feelsLike, precip, wind, isDay,
      tempMin, tempMax, minHour, maxHour,
      xScale, tempScale, precipScale, windScale,
      tempPoints, feelsPoints, precipPoints, windPoints,
      rideX0, rideX1, tempTicks, xTicks,
      lightZones, sunriseH, sunsetH,
    }
  }, [hourlyForecast, rideStartHour, rideEndHour, sunrise, sunset])

  // Hover state
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!data || !svgRef.current) return
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      // Convert mouse position to SVG coordinate space
      const svgX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH
      // Find nearest hour index
      let closest = 0
      let closestDist = Infinity
      for (let i = 0; i < data.hours.length; i++) {
        const px = data.xScale(data.hours[i])
        const dist = Math.abs(svgX - px)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      }
      setHoverIdx(closest)
    },
    [data],
  )

  const handleMouseLeave = useCallback(() => setHoverIdx(null), [])

  if (!data) return null

  const { rideX0, rideX1, tempPoints, feelsPoints, windPoints, tempTicks, xTicks, xScale, tempScale, lightZones, sunriseH, sunsetH } = data

  // Precip bar width
  const barW = Math.max(4, PLOT_W / data.hours.length * 0.6)

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {t('report.weather.dailyForecast')}
        </p>
      </div>
      <div className="px-2 pb-3 overflow-x-auto max-w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto min-w-[480px]"
          role="img"
          aria-label={t('report.weather.dailyForecast')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: hoverIdx != null ? 'crosshair' : undefined }}
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
            {/* Light zone gradients for smooth twilight transitions */}
            {lightZones.morningTwilightX0 != null && lightZones.morningTwilightX1 != null && (
              <>
                <linearGradient id="nightToTwilightMorning" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.10" />
                  <stop offset="100%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="twilightToDayMorning" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.05" />
                  <stop offset="100%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dayToTwilightEvening" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0" />
                  <stop offset="100%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="twilightToNightEvening" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.05" />
                  <stop offset="100%" className="[stop-color:rgb(28,25,23)] dark:[stop-color:rgb(168,162,158)]" stopOpacity="0.10" />
                </linearGradient>
              </>
            )}
          </defs>

          {/* Light zone background shading */}
          {lightZones.morningTwilightX0 != null && (() => {
            const lz = lightZones
            const chartLeft = PADDING.left
            const chartRight = PADDING.left + PLOT_W
            return (
              <>
                {/* Pre-dawn night zone */}
                {lz.morningTwilightX0! > chartLeft && (
                  <rect
                    x={chartLeft}
                    y={PADDING.top}
                    width={lz.morningTwilightX0! - chartLeft}
                    height={PLOT_H}
                    className="fill-stone-900/10 dark:fill-stone-400/[0.08]"
                  />
                )}
                {/* Morning twilight transition (night → twilight) */}
                {lz.morningTwilightX0! < lz.morningTwilightX1! && (
                  <rect
                    x={lz.morningTwilightX0!}
                    y={PADDING.top}
                    width={lz.morningTwilightX1! - lz.morningTwilightX0!}
                    height={PLOT_H}
                    fill="url(#nightToTwilightMorning)"
                  />
                )}
                {/* Morning twilight transition (twilight → day): sunrise to sunrise+offset */}
                {lz.sunriseX != null && (() => {
                  const fadeEnd = Math.min(lz.sunriseX + (lz.morningTwilightX1! - lz.morningTwilightX0!), chartRight)
                  return fadeEnd > lz.sunriseX ? (
                    <rect
                      x={lz.sunriseX}
                      y={PADDING.top}
                      width={fadeEnd - lz.sunriseX}
                      height={PLOT_H}
                      fill="url(#twilightToDayMorning)"
                    />
                  ) : null
                })()}
                {/* Evening twilight transition (day → twilight): before sunset */}
                {lz.sunsetX != null && (() => {
                  const fadeStart = Math.max(lz.sunsetX - (lz.eveningTwilightX1! - lz.eveningTwilightX0!), chartLeft)
                  return lz.sunsetX > fadeStart ? (
                    <rect
                      x={fadeStart}
                      y={PADDING.top}
                      width={lz.sunsetX - fadeStart}
                      height={PLOT_H}
                      fill="url(#dayToTwilightEvening)"
                    />
                  ) : null
                })()}
                {/* Evening twilight zone */}
                {lz.eveningTwilightX0! < lz.eveningTwilightX1! && (
                  <rect
                    x={lz.eveningTwilightX0!}
                    y={PADDING.top}
                    width={lz.eveningTwilightX1! - lz.eveningTwilightX0!}
                    height={PLOT_H}
                    fill="url(#twilightToNightEvening)"
                  />
                )}
                {/* Post-dusk night zone */}
                {lz.eveningTwilightX1! < chartRight && (
                  <rect
                    x={lz.eveningTwilightX1!}
                    y={PADDING.top}
                    width={chartRight - lz.eveningTwilightX1!}
                    height={PLOT_H}
                    className="fill-stone-900/10 dark:fill-stone-400/[0.08]"
                  />
                )}
              </>
            )
          })()}

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

          {/* Sunrise/sunset marker lines */}
          {lightZones.sunriseX != null && (
            <line
              x1={lightZones.sunriseX} x2={lightZones.sunriseX}
              y1={PADDING.top} y2={PADDING.top + PLOT_H}
              className="stroke-amber-400/60 dark:stroke-amber-300/40"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}
          {lightZones.sunsetX != null && (
            <line
              x1={lightZones.sunsetX} x2={lightZones.sunsetX}
              y1={PADDING.top} y2={PADDING.top + PLOT_H}
              className="stroke-amber-400/60 dark:stroke-amber-300/40"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}

          {/* Sunrise icon + label */}
          {lightZones.sunriseX != null && sunrise && (
            <foreignObject
              x={lightZones.sunriseX - 16}
              y={PADDING.top - 18}
              width={32}
              height={18}
              style={{ overflow: 'visible' }}
            >
              <div className="flex flex-col items-center">
                <Sunrise className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-[7px] font-medium text-amber-500 dark:text-amber-400 whitespace-nowrap" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {sunrise}
                </span>
              </div>
            </foreignObject>
          )}
          {/* Sunset icon + label */}
          {lightZones.sunsetX != null && sunset && (
            <foreignObject
              x={lightZones.sunsetX - 16}
              y={PADDING.top - 18}
              width={32}
              height={18}
              style={{ overflow: 'visible' }}
            >
              <div className="flex flex-col items-center">
                <Sunset className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-[7px] font-medium text-amber-500 dark:text-amber-400 whitespace-nowrap" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {sunset}
                </span>
              </div>
            </foreignObject>
          )}

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
              {h >= 24 ? `${h - 24}:00` : `${h}:00`}
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

          {/* Hover crosshair + tooltip */}
          {hoverIdx != null && (() => {
            const hx = data.xScale(data.hours[hoverIdx])
            const hour = data.hours[hoverIdx]
            const displayHour = hour >= 24 ? `${hour - 24}:00` : `${hour}:00`
            const temp = data.temps[hoverIdx]
            const feels = data.feelsLike[hoverIdx]
            const prec = data.precip[hoverIdx]
            const wnd = data.wind[hoverIdx]
            // Tooltip dimensions
            // Check if lights-needed row will be shown
            const hourIsDay = data.isDay[hoverIdx]
            const hourVal = data.hours[hoverIdx]
            const inTwilightCheck = sunriseH != null && sunsetH != null && (
              (hourVal >= sunriseH - 0.5 && hourVal < sunriseH) ||
              (hourVal >= sunsetH && hourVal < sunsetH + 0.5)
            )
            const showLights = !hourIsDay || inTwilightCheck
            const tw = 130
            const th = showLights ? 93 : 80
            const tp = 8
            // Position tooltip to left or right of crosshair depending on space
            const tooltipX = hx + tw + tp > CHART_WIDTH - PADDING.right
              ? hx - tw - tp
              : hx + tp
            const tooltipY = PADDING.top + 4
            return (
              <>
                {/* Vertical crosshair line */}
                <line
                  x1={hx} x2={hx}
                  y1={PADDING.top} y2={PADDING.top + PLOT_H}
                  className="stroke-stone-400 dark:stroke-stone-500"
                  strokeWidth={0.75}
                  strokeDasharray="2,2"
                  pointerEvents="none"
                />
                {/* Dots on each line at hovered point */}
                <circle cx={hx} cy={data.tempPoints[hoverIdx].y} r={3.5}
                  className="fill-amber-500 dark:fill-amber-400 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={data.feelsPoints[hoverIdx].y} r={3}
                  className="fill-blue-400 dark:fill-blue-500 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                <circle cx={hx} cy={data.windPoints[hoverIdx].y} r={3}
                  className="fill-stone-400 dark:fill-stone-500 stroke-white dark:stroke-stone-900" strokeWidth={1.5} pointerEvents="none" />
                {/* Tooltip background */}
                <rect
                  x={tooltipX} y={tooltipY}
                  width={tw} height={th}
                  rx={6}
                  className="fill-white dark:fill-stone-800 stroke-stone-200 dark:stroke-stone-700"
                  strokeWidth={0.5}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
                  pointerEvents="none"
                />
                {/* Tooltip text */}
                <text x={tooltipX + 8} y={tooltipY + 15} style={{ fontSize: 10, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-stone-700 dark:fill-stone-200" pointerEvents="none">
                  {displayHour}
                </text>
                <text x={tooltipX + 8} y={tooltipY + 30} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-amber-600 dark:fill-amber-400" pointerEvents="none">
                  {t('report.weather.legend.temp')}: {temp.toFixed(1)}°
                </text>
                <text x={tooltipX + 8} y={tooltipY + 43} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-blue-500 dark:fill-blue-400" pointerEvents="none">
                  {t('report.weather.legend.feelsLike')}: {feels.toFixed(1)}°
                </text>
                <text x={tooltipX + 8} y={tooltipY + 56} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-blue-400 dark:fill-blue-500" pointerEvents="none">
                  {t('report.weather.legend.precip')}: {prec.toFixed(0)}%
                </text>
                <text x={tooltipX + 8} y={tooltipY + 69} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  className="fill-stone-500 dark:fill-stone-400" pointerEvents="none">
                  {t('report.weather.legend.wind')}: {wnd.toFixed(1)} km/h
                </text>
                {/* Lights needed indicator */}
                {(() => {
                  const hourIsDay = data.isDay[hoverIdx]
                  const hourVal = data.hours[hoverIdx]
                  const inTwilight = sunriseH != null && sunsetH != null && (
                    (hourVal >= sunriseH - 0.5 && hourVal < sunriseH) ||
                    (hourVal >= sunsetH && hourVal < sunsetH + 0.5)
                  )
                  if (!hourIsDay || inTwilight) {
                    return (
                      <text x={tooltipX + 8} y={tooltipY + 82} style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                        className="fill-amber-500 dark:fill-amber-400" pointerEvents="none">
                        🔦 {t('report.weather.chart.lightsNeeded')}
                      </text>
                    )
                  }
                  return null
                })()}
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
          {(rideX0 != null) && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-dashed border-emerald-500 rounded-sm" />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.legend.rideWindow')}</span>
            </div>
          )}
          {lightZones.sunriseX != null && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-stone-900/10 dark:bg-stone-400/[0.08] rounded-sm" />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('report.weather.chart.twilight')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
