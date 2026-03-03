import { useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Gauge, Route } from 'lucide-react'
import type { RideReportProps } from './types'
import type { Product } from '../product-recommendations/types'
import { ConditionBadge } from './ConditionBadge'
import { WeatherPanel } from './WeatherPanel'
import { MultiDayWeatherChart } from './MultiDayWeatherChart'
import { EquipmentList } from './EquipmentList'
import { ClothingItemCard } from './ClothingItemCard'
import { TipsList } from './TipsList'
import { InlineProductLink } from '../product-recommendations/InlineProductLink'
import { RideWindowInfo } from './RideWindowInfo'
import { RouteMap } from './RouteMap'
import { WindAnalysis } from './WindAnalysis'
import { StickyActionBar } from './StickyActionBar'
import { DayTimeline } from './DayTimeline'

export function RideReport({ report, onShare, shareLoading, onSaveRoute, routeSaving, routeSaved, onLoginToSave, onSaveChanges, saveChangesLoading, hasUnsavedChanges, onEditRide, onNewRide, products, shops, disclosure, onProductClick }: RideReportProps) {
  const { t } = useTranslation()
  const chartScrollRef = useRef<HTMLDivElement | null>(null)

  const isMultiDay = report.days.length > 1
  const activeDay = report.days[0]

  const shopMap = useMemo(
    () => (shops ? new Map(shops.map((s) => [s.id, s])) : new Map()),
    [shops],
  )

  // For multi-day: use merged items; for single-day: use active day items
  const clothingItems = isMultiDay
    ? (report.mergedClothingItems ?? activeDay?.clothingItems ?? [])
    : (activeDay?.clothingItems ?? [])
  const equipmentItems = isMultiDay
    ? (report.mergedEquipment ?? activeDay?.equipment ?? [])
    : (activeDay?.equipment ?? [])

  // Tips: merged for multi-day, per-day for single
  const tips = isMultiDay
    ? (report.tips ?? [])
    : (activeDay?.tips ?? [])

  function findItemProduct(itemIcon: string): Product | undefined {
    return products?.find((p) => p.matchesIcon === itemIcon)
  }

  const handleChartRef = useCallback((el: HTMLDivElement | null) => {
    chartScrollRef.current = el
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* ── 1. HEADER ── */}
      <div>
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {report.rideName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
            {report.startLocation}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" strokeWidth={1.5} />
            {report.totalDistance} {report.distanceUnit}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" strokeWidth={1.5} />
            {report.ridingStyle}
          </span>
          {isMultiDay && (
            <span className="text-stone-400 dark:text-stone-500">
              {t('report.days', { count: report.days.length })}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. CONDITION BADGE (full-width) ── */}
      <ConditionBadge condition={report.overallCondition} reasons={report.overallConditionReasons} />

      {/* ── 3. RIDE INFO ── */}
      {!isMultiDay && activeDay && activeDay.rideStartHour != null && activeDay.rideEndHour != null && (
        <RideWindowInfo
          rideStartHour={activeDay.rideStartHour}
          rideEndHour={activeDay.rideEndHour}
          estimatedDurationMinutes={activeDay.estimatedDurationMinutes}
          averageSpeedKmh={activeDay.averageSpeedKmh}
        />
      )}

      {/* ── 3b. MULTI-DAY TIMELINE ── */}
      {isMultiDay && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('report.days', { count: report.days.length })}
          </h2>
          <DayTimeline days={report.days} />
        </section>
      )}

      {/* ── 4. TIPS & SAFETY (moved up) ── */}
      {tips.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('report.section.tips')}
          </h2>
          <TipsList tips={tips} />
        </section>
      )}

      {/* ── 5. ROUTE MAP + WIND ANALYSIS ── */}
      {report.routeGeometry && report.destinationLocation && (
        <section className="space-y-4">
          <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm relative z-0">
            <RouteMap
              startLocation={{
                lat: report.routeGeometry[0][0],
                lon: report.routeGeometry[0][1],
                label: report.startLocation
              }}
              destinationLocation={{
                lat: report.routeGeometry[report.routeGeometry.length - 1][0],
                lon: report.routeGeometry[report.routeGeometry.length - 1][1],
                label: report.destinationLocation
              }}
              routeGeometry={report.routeGeometry}
              routeSegments={report.routeSegments}
              waypoints={report.waypoints}
              className="w-full h-full"
            />
          </div>
          {report.waypoints && report.waypoints.length > 0 && (
            <WindAnalysis waypoints={report.waypoints} />
          )}
        </section>
      )}
      {/* Wind analysis without route map (no destination but has waypoints) */}
      {!(report.routeGeometry && report.destinationLocation) && report.waypoints && report.waypoints.length > 0 && (
        <section>
          <WindAnalysis waypoints={report.waypoints} />
        </section>
      )}

      {/* ── 6. WEATHER ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('report.section.weather')}
        </h2>
        {isMultiDay ? (
          <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
            <MultiDayWeatherChart
              days={report.days}
              onChartRef={handleChartRef}
            />
          </div>
        ) : activeDay && (
          <WeatherPanel
            weather={activeDay.weather}
            hourlyForecast={activeDay.hourlyForecast}
            rideStartHour={activeDay.rideStartHour}
            rideEndHour={activeDay.rideEndHour}
            weatherSummary={activeDay.weatherSummary}
          />
        )}
      </section>

      {/* ── 7. CLOTHING ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {isMultiDay ? t('report.section.packingList') : t('report.section.clothing')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {clothingItems.map((item) => {
            const itemProduct = disclosure ? findItemProduct(item.icon) : undefined
            const shop = itemProduct ? shopMap.get(itemProduct.shopId) : undefined
            return (
              <ClothingItemCard
                key={item.id}
                item={item}
                productLink={
                  itemProduct && shop && disclosure ? (
                    <InlineProductLink
                      product={itemProduct}
                      shop={shop}
                      disclosure={disclosure}
                      onProductClick={onProductClick}
                    />
                  ) : undefined
                }
              />
            )
          })}
        </div>
      </section>

      {/* ── 8. EQUIPMENT ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('report.section.equipment')}
        </h2>
        <EquipmentList items={equipmentItems} />
      </section>

      {/* ── 9. STICKY ACTION BAR ── */}
      <StickyActionBar
        onEditRide={onEditRide}
        onNewRide={onNewRide}
        onShare={onShare}
        shareLoading={shareLoading}
        onSaveRoute={onSaveRoute}
        routeSaving={routeSaving}
        routeSaved={routeSaved}
        onLoginToSave={onLoginToSave}
        onSaveChanges={onSaveChanges}
        saveChangesLoading={saveChangesLoading}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  )
}
