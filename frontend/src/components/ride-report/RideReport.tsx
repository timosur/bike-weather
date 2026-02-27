import { useState, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Bookmark, BookmarkCheck, MapPin, Gauge, Route, PenLine, Plus, Save, Check, Loader2 } from 'lucide-react'
import type { RideReportProps } from './types'
import type { Product } from '../product-recommendations/types'
import { ConditionBadge } from './ConditionBadge'
import { DayTabs } from './DayTabs'
import { WeatherPanel } from './WeatherPanel'
import { MultiDayWeatherChart } from './MultiDayWeatherChart'
import { MultiDayWeatherSummary } from './MultiDayWeatherSummary'
import { EquipmentList } from './EquipmentList'
import { ClothingItemCard } from './ClothingItemCard'
import { TipsList } from './TipsList'
import { InlineProductLink } from '../product-recommendations/InlineProductLink'

export function RideReport({ report, onShare, shareLoading, onSaveRoute, routeSaving, routeSaved, onLoginToSave, onSaveChanges, saveChangesLoading, hasUnsavedChanges, onEditRide, onNewRide, onDaySelect, products, shops, disclosure, onProductClick }: RideReportProps) {
  const { t } = useTranslation()
  const [activeDayId, setActiveDayId] = useState(report.days[0]?.id ?? '')
  const chartScrollRef = useRef<HTMLDivElement | null>(null)

  const isMultiDay = report.days.length > 1

  const activeDay = report.days.find((d) => d.id === activeDayId) ?? report.days[0]

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

  function findItemProduct(itemIcon: string): Product | undefined {
    return products?.find((p) => p.matchesIcon === itemIcon)
  }

  const handleChartRef = useCallback((el: HTMLDivElement | null) => {
    chartScrollRef.current = el
  }, [])

  function handleDaySelect(dayId: string) {
    setActiveDayId(dayId)
    onDaySelect?.(dayId)

    // Multi-day: scroll chart to the selected day
    if (isMultiDay && chartScrollRef.current) {
      const dayMarker = chartScrollRef.current.querySelector(`[data-day-id="${dayId}"]`)
      if (dayMarker) {
        const container = chartScrollRef.current
        const markerRect = dayMarker.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const scrollLeft = container.scrollLeft + (markerRect.left - containerRect.left) - 20
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
          <div className="mt-3">
            <ConditionBadge condition={report.overallCondition} reasons={report.overallConditionReasons} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEditRide && (
            <button
              onClick={onEditRide}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <PenLine className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('planner.editRide')}</span>
            </button>
          )}
          {/* Save Changes button for edit mode */}
          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              disabled={saveChangesLoading || !hasUnsavedChanges}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${!hasUnsavedChanges
                ? 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 cursor-default'
                : saveChangesLoading
                  ? 'text-white bg-emerald-600/70 cursor-wait'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
            >
              {saveChangesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : hasUnsavedChanges ? (
                <Save className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Check className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">
                {saveChangesLoading
                  ? t('report.savingChanges')
                  : hasUnsavedChanges
                    ? t('report.saveChanges')
                    : t('report.noChanges')}
              </span>
            </button>
          )}
          {onNewRide && (
            <button
              onClick={onNewRide}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('report.newRide')}</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare?.()}
              disabled={shareLoading}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${shareLoading ? 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 cursor-wait' : 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            >
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{shareLoading ? t('report.sharing') : t('report.share')}</span>
            </button>
          )}
          {onSaveRoute && (
            <button
              onClick={() => onSaveRoute()}
              disabled={routeSaving || routeSaved}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${routeSaved
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 cursor-default'
                : routeSaving
                  ? 'text-white bg-emerald-600/70 cursor-wait'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
            >
              {routeSaved ? (
                <BookmarkCheck className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">
                {routeSaved ? t('report.saved') : routeSaving ? t('report.saving') : t('report.save')}
              </span>
            </button>
          )}
          {!onSaveRoute && onLoginToSave && (
            <button
              onClick={() => onLoginToSave()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('report.loginToSave')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Day Tabs — as jump-links for multi-day, tab switch for single-day */}
      <DayTabs days={report.days} activeDayId={activeDayId} onDaySelect={handleDaySelect} />

      {/* --- MULTI-DAY LAYOUT --- */}
      {isMultiDay && (
        <div className="space-y-6">
          {/* Weather summary across all days */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.weather')}
            </h2>
            <MultiDayWeatherSummary days={report.days} />
          </section>

          {/* Continuous weather chart across all days */}
          <section>
            <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
              <MultiDayWeatherChart
                days={report.days}
                onChartRef={handleChartRef}
              />
            </div>
          </section>

          {/* Merged packing list */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.packingList')}
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

          {/* Merged equipment */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.equipment')}
            </h2>
            <EquipmentList items={equipmentItems} />
          </section>

          {/* Tips & Safety */}
          {report.tips && report.tips.length > 0 && (
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t('report.section.tips')}
              </h2>
              <TipsList tips={report.tips} />
            </section>
          )}
        </div>
      )}

      {/* --- SINGLE-DAY LAYOUT (unchanged) --- */}
      {!isMultiDay && activeDay && (
        <div className="space-y-6">
          {/* Weather */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.weather')}
            </h2>
            <WeatherPanel
              weather={activeDay.weather}
              hourlyForecast={activeDay.hourlyForecast}
              rideStartHour={activeDay.rideStartHour}
              rideEndHour={activeDay.rideEndHour}
            />
          </section>

          {/* Clothing */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.clothing')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeDay.clothingItems.map((item) => {
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

          {/* Equipment */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.equipment')}
            </h2>
            <EquipmentList items={activeDay.equipment} />
          </section>

          {/* Tips & Safety */}
          {activeDay.tips && activeDay.tips.length > 0 && (
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t('report.section.tips')}
              </h2>
              <TipsList tips={activeDay.tips} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
