import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { X } from 'lucide-react'
import type { ClothingItem } from './types'
import type { ClothingZoneId } from '../product-recommendations/types'
import type { Product, Shop, AffiliateDisclosure } from '../product-recommendations/types'
import { groupItemsByZone, ZONE_ORDER } from './clothingZoneMap'
import { ClothingItemCard } from './ClothingItemCard'
import { InlineProductLink } from '../product-recommendations/InlineProductLink'

interface BodyZoneVisualizerProps {
  clothingItems: ClothingItem[]
  onSwap?: (itemId: string, alternativeId: string) => void
  products?: Product[]
  shopMap: Map<string, Shop>
  disclosure?: AffiliateDisclosure
  findItemProduct: (itemName: string) => Product | undefined
  onProductClick?: (productId: string) => void
}

/** Zone display metadata */
const ZONE_META: Record<ClothingZoneId, { labelKey: string }> = {
  head: { labelKey: 'report.zone.head' },
  upperBody: { labelKey: 'report.zone.upperBody' },
  lowerBody: { labelKey: 'report.zone.lowerBody' },
  hands: { labelKey: 'report.zone.hands' },
  feet: { labelKey: 'report.zone.feet' },
}

/**
 * SVG body silhouette with clickable zones that expand to show gear details.
 * Replaces the flat grid of ClothingItemCards in the ride report.
 */
export function BodyZoneVisualizer({
  clothingItems,
  onSwap,
  shopMap,
  disclosure,
  findItemProduct,
  onProductClick,
}: BodyZoneVisualizerProps) {
  const { t } = useTranslation()
  const [selectedZone, setSelectedZone] = useState<ClothingZoneId | null>(null)

  const grouped = useMemo(() => groupItemsByZone(clothingItems), [clothingItems])

  function handleZoneClick(zone: ClothingZoneId) {
    setSelectedZone((prev) => (prev === zone ? null : zone))
  }

  const hasItems = (zone: ClothingZoneId) => grouped[zone].length > 0
  const hasAlternatives = (zone: ClothingZoneId) =>
    grouped[zone].some((item) => item.alternatives && item.alternatives.length > 0)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* SVG Silhouette */}
      <div className="flex-shrink-0 self-center lg:self-start">
        <svg
          viewBox="0 0 200 420"
          className="w-48 h-auto sm:w-56 lg:w-64"
          aria-label={t('report.zone.bodyLabel', 'Body zone overview')}
        >
          {/* ---- HEAD zone ---- */}
          <g
            className="cursor-pointer"
            onClick={() => handleZoneClick('head')}
            role="button"
            aria-label={t(ZONE_META.head.labelKey)}
          >
            {/* Head circle */}
            <circle
              cx="100"
              cy="42"
              r="28"
              className={zoneClass('head', selectedZone, hasItems('head'))}
              strokeWidth={2}
            />
            {/* Neck */}
            <rect
              x="92"
              y="70"
              width="16"
              height="14"
              rx="4"
              className={zoneClass('head', selectedZone, hasItems('head'))}
              strokeWidth={2}
            />
            <ZoneLabel
              x={100}
              y={42}
              zone="head"
              count={grouped.head.length}
              isSelected={selectedZone === 'head'}
              hasItems={hasItems('head')}
              hasAlternatives={hasAlternatives('head')}
              t={t}
            />
          </g>

          {/* ---- UPPER BODY zone ---- */}
          <g
            className="cursor-pointer"
            onClick={() => handleZoneClick('upperBody')}
            role="button"
            aria-label={t(ZONE_META.upperBody.labelKey)}
          >
            {/* Torso */}
            <path
              d="M68 84 C68 84 72 80 100 80 C128 80 132 84 132 84 L138 180 C138 185 132 188 132 188 L68 188 C68 188 62 185 62 180 Z"
              className={zoneClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={2}
            />
            {/* Shoulders / upper arms */}
            <path
              d="M68 84 L46 100 L42 148 L58 148 L62 108"
              className={zoneClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={2}
              fill="none"
            />
            <path
              d="M132 84 L154 100 L158 148 L142 148 L138 108"
              className={zoneClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={2}
              fill="none"
            />
            <ZoneLabel
              x={100}
              y={134}
              zone="upperBody"
              count={grouped.upperBody.length}
              isSelected={selectedZone === 'upperBody'}
              hasItems={hasItems('upperBody')}
              hasAlternatives={hasAlternatives('upperBody')}
              t={t}
            />
          </g>

          {/* ---- HANDS zone ---- */}
          <g
            className="cursor-pointer"
            onClick={() => handleZoneClick('hands')}
            role="button"
            aria-label={t(ZONE_META.hands.labelKey)}
          >
            {/* Left hand */}
            <ellipse
              cx="40"
              cy="164"
              rx="12"
              ry="16"
              className={zoneClass('hands', selectedZone, hasItems('hands'))}
              strokeWidth={2}
            />
            {/* Right hand */}
            <ellipse
              cx="160"
              cy="164"
              rx="12"
              ry="16"
              className={zoneClass('hands', selectedZone, hasItems('hands'))}
              strokeWidth={2}
            />
            {/* Left label */}
            <ZoneLabel
              x={40}
              y={164}
              zone="hands"
              count={grouped.hands.length}
              isSelected={selectedZone === 'hands'}
              hasItems={hasItems('hands')}
              hasAlternatives={hasAlternatives('hands')}
              t={t}
              small
            />
          </g>

          {/* ---- LOWER BODY zone ---- */}
          <g
            className="cursor-pointer"
            onClick={() => handleZoneClick('lowerBody')}
            role="button"
            aria-label={t(ZONE_META.lowerBody.labelKey)}
          >
            {/* Left leg */}
            <path
              d="M68 188 L72 192 L72 320 L58 320 L62 188"
              className={zoneClass('lowerBody', selectedZone, hasItems('lowerBody'))}
              strokeWidth={2}
            />
            {/* Right leg */}
            <path
              d="M132 188 L128 192 L128 320 L142 320 L138 188"
              className={zoneClass('lowerBody', selectedZone, hasItems('lowerBody'))}
              strokeWidth={2}
            />
            {/* Hips connector */}
            <path
              d="M68 188 L100 196 L132 188"
              className={zoneClass('lowerBody', selectedZone, hasItems('lowerBody'))}
              strokeWidth={2}
              fill="none"
            />
            <ZoneLabel
              x={100}
              y={260}
              zone="lowerBody"
              count={grouped.lowerBody.length}
              isSelected={selectedZone === 'lowerBody'}
              hasItems={hasItems('lowerBody')}
              hasAlternatives={hasAlternatives('lowerBody')}
              t={t}
            />
          </g>

          {/* ---- FEET zone ---- */}
          <g
            className="cursor-pointer"
            onClick={() => handleZoneClick('feet')}
            role="button"
            aria-label={t(ZONE_META.feet.labelKey)}
          >
            {/* Left foot */}
            <path
              d="M58 320 L52 344 C50 352 56 356 66 356 L72 356 C78 356 80 350 78 344 L72 320 Z"
              className={zoneClass('feet', selectedZone, hasItems('feet'))}
              strokeWidth={2}
            />
            {/* Right foot */}
            <path
              d="M128 320 L122 344 C120 352 126 356 136 356 L142 356 C148 356 150 350 148 344 L142 320 Z"
              className={zoneClass('feet', selectedZone, hasItems('feet'))}
              strokeWidth={2}
            />
            <ZoneLabel
              x={100}
              y={340}
              zone="feet"
              count={grouped.feet.length}
              isSelected={selectedZone === 'feet'}
              hasItems={hasItems('feet')}
              hasAlternatives={hasAlternatives('feet')}
              t={t}
            />
          </g>
        </svg>
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0">
        {selectedZone ? (
          <div className="space-y-3">
            {/* Zone header */}
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t(ZONE_META[selectedZone].labelKey)}
                <span className="ml-2 text-xs font-normal text-stone-400 dark:text-stone-500 normal-case tracking-normal">
                  {grouped[selectedZone].length === 1
                    ? t('report.zone.itemCount_one', '1 item')
                    : t('report.zone.itemCount', '{{count}} items', { count: grouped[selectedZone].length })}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label={t('report.zone.close', 'Close')}
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Items */}
            {grouped[selectedZone].length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {grouped[selectedZone].map((item) => {
                  const itemProduct = disclosure ? findItemProduct(item.name) : undefined
                  const shop = itemProduct ? shopMap.get(itemProduct.shopId) : undefined
                  return (
                    <ClothingItemCard
                      key={item.id}
                      item={item}
                      onSwap={(altId) => onSwap?.(item.id, altId)}
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
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500 italic">
                {t('report.zone.noGear', 'No gear needed for this zone.')}
              </p>
            )}
          </div>
        ) : (
          /* Prompt to select a zone */
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center space-y-3">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                {t('report.zone.selectPrompt', 'Tap a body zone to see gear details')}
              </p>
              {/* Quick zone buttons for mobile */}
              <div className="flex flex-wrap justify-center gap-2 lg:hidden">
                {ZONE_ORDER.filter((z) => hasItems(z)).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleZoneClick(zone)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                  >
                    {t(ZONE_META[zone].labelKey)}
                    <span className="text-emerald-500 dark:text-emerald-500">
                      {grouped[zone].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

/** Returns Tailwind classes for a zone shape based on state */
function zoneClass(
  zone: ClothingZoneId,
  selectedZone: ClothingZoneId | null,
  hasItems: boolean,
): string {
  const base = 'transition-all duration-200'

  if (!hasItems) {
    // Empty zone — dashed outline, muted
    return `${base} fill-stone-50 dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-700 stroke-dasharray-4`
  }

  if (selectedZone === zone) {
    // Selected
    return `${base} fill-emerald-100 dark:fill-emerald-950/50 stroke-emerald-500 dark:stroke-emerald-400`
  }

  // Has items, idle
  return `${base} fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-400 dark:stroke-emerald-600 hover:fill-emerald-100 dark:hover:fill-emerald-950/40`
}

/** Small label rendered inside the SVG on top of a body zone */
function ZoneLabel({
  x,
  y,
  zone: _zone,
  count,
  isSelected,
  hasItems,
  hasAlternatives,
  t,
  small,
}: {
  x: number
  y: number
  zone: ClothingZoneId
  count: number
  isSelected: boolean
  hasItems: boolean
  hasAlternatives: boolean
  t: TFunction
  small?: boolean
}) {
  if (!hasItems) return null

  const fontSize = small ? 9 : 11
  const badgeR = small ? 8 : 10

  return (
    <g className="pointer-events-none">
      {/* Count badge */}
      <circle
        cx={x}
        cy={y - (small ? 0 : 4)}
        r={badgeR}
        className={
          isSelected
            ? 'fill-emerald-500 dark:fill-emerald-400'
            : 'fill-emerald-400 dark:fill-emerald-600'
        }
      />
      <text
        x={x}
        y={y - (small ? 0 : 4) + 1}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white dark:fill-stone-950 font-semibold"
        style={{ fontSize, fontFamily: 'Inter, sans-serif' }}
      >
        {count}
      </text>

      {/* Alternatives indicator — small amber dot */}
      {hasAlternatives && (
        <circle
          cx={x + badgeR + 3}
          cy={y - (small ? 0 : 4) - badgeR + 3}
          r={3}
          className="fill-amber-400 dark:fill-amber-500"
        />
      )}

      {/* Label text below the badge (not on small) */}
      {!small && (
        <text
          x={x}
          y={y + 14}
          textAnchor="middle"
          className="fill-stone-500 dark:fill-stone-400"
          style={{ fontSize: 9, fontFamily: 'Inter, sans-serif' }}
        >
          {count === 1
            ? t('report.zone.itemCount_one', '1 item')
            : t('report.zone.itemCount', '{{count}} items', { count })}
        </text>
      )}
    </g>
  )
}
