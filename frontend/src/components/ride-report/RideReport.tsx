import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Bookmark, BookmarkCheck, MapPin, Gauge, Route } from 'lucide-react'
import type { RideReportProps } from './types'
import type { Product } from '../product-recommendations/types'
import { ConditionBadge } from './ConditionBadge'
import { DayTabs } from './DayTabs'
import { WeatherPanel } from './WeatherPanel'
import { ClothingItemCard } from './ClothingItemCard'
import { EquipmentList } from './EquipmentList'
import { InlineProductLink } from '../product-recommendations/InlineProductLink'

export function RideReport({ report, onShare, onSaveRoute, routeSaving, routeSaved, onDaySelect, onSwapClothingItem, products, shops, disclosure, onProductClick }: RideReportProps) {
  const { t } = useTranslation()
  const [activeDayId, setActiveDayId] = useState(report.days[0]?.id ?? '')

  const activeDay = report.days.find((d) => d.id === activeDayId) ?? report.days[0]

  const shopMap = useMemo(
    () => (shops ? new Map(shops.map((s) => [s.id, s])) : new Map()),
    [shops],
  )

  function findItemProduct(itemName: string): Product | undefined {
    return products?.find((p) => p.matchesLabel === itemName)
  }

  function handleDaySelect(dayId: string) {
    setActiveDayId(dayId)
    onDaySelect?.(dayId)
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
            {report.days.length > 1 && (
              <span className="text-stone-400 dark:text-stone-500">
                {t('report.days', { count: report.days.length })}
              </span>
            )}
          </div>
          <div className="mt-3">
            <ConditionBadge condition={report.overallCondition} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onShare?.()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">{t('report.share')}</span>
          </button>
          <button
            onClick={() => onSaveRoute?.()}
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
        </div>
      </div>

      {/* Day Tabs */}
      <DayTabs days={report.days} activeDayId={activeDayId} onDaySelect={handleDaySelect} />

      {/* Active Day Content */}
      {activeDay && (
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

          {/* Clothing Items */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.section.clothing')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeDay.clothingItems.map((item) => {
                const itemProduct = disclosure ? findItemProduct(item.name) : undefined
                const shop = itemProduct ? shopMap.get(itemProduct.shopId) : undefined
                return (
                  <ClothingItemCard
                    key={item.id}
                    item={item}
                    onSwap={(altId) => onSwapClothingItem?.(activeDay.id, item.id, altId)}
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

        </div>
      )}
    </div>
  )
}
