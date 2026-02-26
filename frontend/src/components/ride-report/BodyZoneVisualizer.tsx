import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ChevronDown } from 'lucide-react'
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
          viewBox="0 0 180 270"
          className="w-48 h-auto sm:w-56 lg:w-64"
          aria-label={t('report.zone.bodyLabel', 'Body zone overview')}
        >
          <defs>
            <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── HEAD — simple circle ── */}
          <g className="cursor-pointer" onClick={() => handleZoneClick('head')} role="button"
            aria-label={t(ZONE_META.head.labelKey)}>
            <circle cx="90" cy="24" r="18"
              className={zoneShapeClass('head', selectedZone, hasItems('head'))}
              strokeWidth={1.5} filter={selectedZone === 'head' ? 'url(#zone-glow)' : undefined} />
          </g>

          {/* ── UPPER BODY — torso + angled arms ── */}
          <g className="cursor-pointer" onClick={() => handleZoneClick('upperBody')} role="button"
            aria-label={t(ZONE_META.upperBody.labelKey)}>
            {/* Torso */}
            <rect x="66" y="50" width="48" height="76" rx="6"
              className={zoneShapeClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={1.5} filter={selectedZone === 'upperBody' ? 'url(#zone-glow)' : undefined} />
            {/* Left arm — angled outward from left shoulder */}
            <rect x="-7" y="0" width="14" height="68" rx="7"
              transform="translate(66,54) rotate(15)"
              className={zoneShapeClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={1.5} filter={selectedZone === 'upperBody' ? 'url(#zone-glow)' : undefined} />
            {/* Right arm — angled outward from right shoulder */}
            <rect x="-7" y="0" width="14" height="68" rx="7"
              transform="translate(114,54) rotate(-15)"
              className={zoneShapeClass('upperBody', selectedZone, hasItems('upperBody'))}
              strokeWidth={1.5} filter={selectedZone === 'upperBody' ? 'url(#zone-glow)' : undefined} />
          </g>

          {/* ── HANDS — small pills at angled arm ends ── */}
          <g className="cursor-pointer" onClick={() => handleZoneClick('hands')} role="button"
            aria-label={t(ZONE_META.hands.labelKey)}>
            {/* Left hand — positioned at end of left angled arm */}
            <rect x="-6" y="0" width="12" height="18" rx="6"
              transform="translate(49,120)"
              className={zoneShapeClass('hands', selectedZone, hasItems('hands'))}
              strokeWidth={1.5} filter={selectedZone === 'hands' ? 'url(#zone-glow)' : undefined} />
            {/* Right hand — positioned at end of right angled arm */}
            <rect x="-6" y="0" width="12" height="18" rx="6"
              transform="translate(131,120)"
              className={zoneShapeClass('hands', selectedZone, hasItems('hands'))}
              strokeWidth={1.5} filter={selectedZone === 'hands' ? 'url(#zone-glow)' : undefined} />
          </g>

          {/* ── LOWER BODY — two legs ── */}
          <g className="cursor-pointer" onClick={() => handleZoneClick('lowerBody')} role="button"
            aria-label={t(ZONE_META.lowerBody.labelKey)}>
            <rect x="68" y="132" width="18" height="84" rx="8"
              className={zoneShapeClass('lowerBody', selectedZone, hasItems('lowerBody'))}
              strokeWidth={1.5} filter={selectedZone === 'lowerBody' ? 'url(#zone-glow)' : undefined} />
            <rect x="94" y="132" width="18" height="84" rx="8"
              className={zoneShapeClass('lowerBody', selectedZone, hasItems('lowerBody'))}
              strokeWidth={1.5} filter={selectedZone === 'lowerBody' ? 'url(#zone-glow)' : undefined} />
          </g>

          {/* ── FEET — rounded blocks at leg ends ── */}
          <g className="cursor-pointer" onClick={() => handleZoneClick('feet')} role="button"
            aria-label={t(ZONE_META.feet.labelKey)}>
            <rect x="64" y="222" width="24" height="12" rx="6"
              className={zoneShapeClass('feet', selectedZone, hasItems('feet'))}
              strokeWidth={1.5} filter={selectedZone === 'feet' ? 'url(#zone-glow)' : undefined} />
            <rect x="92" y="222" width="24" height="12" rx="6"
              className={zoneShapeClass('feet', selectedZone, hasItems('feet'))}
              strokeWidth={1.5} filter={selectedZone === 'feet' ? 'url(#zone-glow)' : undefined} />
          </g>

          {/* ── ZONE BADGES ── */}
          <ZoneBadge x={90} y={24} zone="head" count={grouped.head.length}
            isSelected={selectedZone === 'head'} hasItems={hasItems('head')}
            hasAlternatives={hasAlternatives('head')} onClick={handleZoneClick} t={t} />
          <ZoneBadge x={90} y={88} zone="upperBody" count={grouped.upperBody.length}
            isSelected={selectedZone === 'upperBody'} hasItems={hasItems('upperBody')}
            hasAlternatives={hasAlternatives('upperBody')} onClick={handleZoneClick} t={t} />
          <ZoneBadge x={90} y={129} zone="hands" count={grouped.hands.length}
            isSelected={selectedZone === 'hands'} hasItems={hasItems('hands')}
            hasAlternatives={hasAlternatives('hands')} onClick={handleZoneClick} t={t} small />
          <ZoneBadge x={90} y={174} zone="lowerBody" count={grouped.lowerBody.length}
            isSelected={selectedZone === 'lowerBody'} hasItems={hasItems('lowerBody')}
            hasAlternatives={hasAlternatives('lowerBody')} onClick={handleZoneClick} t={t} />
          <ZoneBadge x={90} y={230} zone="feet" count={grouped.feet.length}
            isSelected={selectedZone === 'feet'} hasItems={hasItems('feet')}
            hasAlternatives={hasAlternatives('feet')} onClick={handleZoneClick} t={t} />
        </svg>
      </div>

      {/* All zones — collapsible accordion */}
      <div className="flex-1 min-w-0 space-y-2">
        {ZONE_ORDER.filter((z) => hasItems(z)).map((zone) => {
          const isExpanded = selectedZone === zone
          return (
            <div key={zone}>
              {/* Zone headline — always visible, acts as toggle */}
              <button
                type="button"
                onClick={() => handleZoneClick(zone)}
                className={[
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                  isExpanded
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
                ].join(' ')}
              >
                <h3
                  className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {t(ZONE_META[zone].labelKey)}
                  <span className="ml-2 text-xs font-medium text-stone-500 dark:text-stone-400 normal-case tracking-normal">
                    {grouped[zone].length === 1
                      ? t('report.zone.itemCount_one', '1 item')
                      : t('report.zone.itemCount', '{{count}} items', { count: grouped[zone].length })}
                  </span>
                </h3>
                <ChevronDown
                  className={[
                    'w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform duration-200',
                    isExpanded ? 'rotate-180' : '',
                  ].join(' ')}
                  strokeWidth={2}
                />
              </button>

              {/* Collapsible items */}
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pb-1 px-1">
                  {grouped[zone].map((item) => {
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

/** Returns Tailwind classes for a zone shape based on state */
function zoneShapeClass(
  zone: ClothingZoneId,
  selectedZone: ClothingZoneId | null,
  hasItems: boolean,
): string {
  const base = 'transition-all duration-200'

  if (!hasItems) {
    return `${base} fill-stone-100/50 dark:fill-stone-800/30 stroke-stone-300/60 dark:stroke-stone-700/60`
  }

  if (selectedZone === zone) {
    return `${base} fill-emerald-200/60 dark:fill-emerald-900/40 stroke-emerald-500 dark:stroke-emerald-400`
  }

  return `${base} fill-emerald-100/40 dark:fill-emerald-950/25 stroke-emerald-400/70 dark:stroke-emerald-600/70 hover:fill-emerald-200/50 dark:hover:fill-emerald-900/30 hover:stroke-emerald-500 dark:hover:stroke-emerald-500`
}

/** Clickable count badge rendered on top of a body zone */
function ZoneBadge({
  x,
  y,
  zone,
  count,
  isSelected,
  hasItems,
  hasAlternatives,
  onClick,
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
  onClick: (zone: ClothingZoneId) => void
  t: TFunction
  small?: boolean
}) {
  if (!hasItems) return null

  const fontSize = small ? 9 : 11
  const badgeR = small ? 9 : 12

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation()
        onClick(zone)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(zone) }}
    >
      {/* Hit area — invisible larger circle for easier tapping */}
      <circle cx={x} cy={y} r={badgeR + 6} fill="transparent" />

      {/* Badge background */}
      <circle
        cx={x}
        cy={y}
        r={badgeR}
        className={
          isSelected
            ? 'fill-emerald-500 dark:fill-emerald-400 transition-all duration-200'
            : 'fill-emerald-500/80 dark:fill-emerald-500/70 hover:fill-emerald-500 dark:hover:fill-emerald-400 transition-all duration-200'
        }
      />
      {/* Ring around badge */}
      <circle
        cx={x}
        cy={y}
        r={badgeR + 2}
        fill="none"
        strokeWidth={1.5}
        className={
          isSelected
            ? 'stroke-emerald-400 dark:stroke-emerald-300'
            : 'stroke-emerald-400/50 dark:stroke-emerald-500/40'
        }
      />

      {/* Count text */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white font-bold pointer-events-none"
        style={{ fontSize, fontFamily: 'Inter, sans-serif' }}
      >
        {count}
      </text>

      {/* Alternatives indicator — small amber dot */}
      {hasAlternatives && (
        <circle
          cx={x + badgeR + 2}
          cy={y - badgeR + 2}
          r={3.5}
          className="fill-amber-400 dark:fill-amber-400 stroke-white dark:stroke-stone-900"
          strokeWidth={1}
        />
      )}
    </g>
  )
}
