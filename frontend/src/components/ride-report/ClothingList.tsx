import { useTranslation } from 'react-i18next'
import type { ClothingItem, MatchedProduct, ProductRecommendations } from './types'
import { InlineProductLink } from '../product-recommendations/InlineProductLink'

/** Body zone keys in display order */
const ZONE_ORDER = ['head', 'eyes', 'neck', 'upperBody', 'lowerBody', 'hands', 'feet', 'other'] as const

type BodyZone = typeof ZONE_ORDER[number]

/** Map generic clothing item IDs to body zones (mirrors backend _ITEM_ZONE) */
const ITEM_ZONE: Record<string, BodyZone> = {
  // Head
  'cl-helmet-cover': 'head',
  'cl-headband': 'head',
  'cl-cycling-cap': 'head',
  // Eyes
  'cl-sunglasses': 'eyes',
  'cl-glasses': 'eyes',
  'cl-glasses-wind': 'eyes',
  // Neck / Face
  'cl-neck-gaiter': 'neck',
  'cl-face-mask': 'neck',
  // Upper body
  'cl-base-merino': 'upperBody',
  'cl-base-wicking': 'upperBody',
  'cl-thermal-jersey': 'upperBody',
  'cl-jersey-long': 'upperBody',
  'cl-jersey-arm': 'upperBody',
  'cl-jersey-long-light': 'upperBody',
  'cl-jersey-short-alt': 'upperBody',
  'cl-jersey-short': 'upperBody',
  'cl-jersey-sleeveless': 'upperBody',
  'cl-rain-jacket': 'upperBody',
  'cl-packable-rain': 'upperBody',
  'cl-vest-alt': 'upperBody',
  'cl-wind-jacket': 'upperBody',
  'cl-wind-vest': 'upperBody',
  'cl-jacket-alt': 'upperBody',
  'cl-insulated-jacket': 'upperBody',
  'cl-windstopper-jacket': 'upperBody',
  // Lower body
  'cl-thermal-tights': 'lowerBody',
  'cl-thermal-undershorts': 'lowerBody',
  'cl-tights-warmers': 'lowerBody',
  'cl-padded-tights': 'lowerBody',
  'cl-shorts-warmers': 'lowerBody',
  'cl-shorts': 'lowerBody',
  'cl-overpants': 'lowerBody',
  // Hands
  'cl-gloves-waterproof': 'hands',
  'cl-gloves-wp': 'hands',
  'cl-gloves-warm': 'hands',
  'cl-gloves-light': 'hands',
  // Feet
  'cl-shoe-covers': 'feet',
  'cl-shoes': 'feet',
  'cl-socks-warm': 'feet',
  'cl-socks-mid': 'feet',
  'cl-socks-thin': 'feet',
}

/** Bike-type suffixes that the backend appends via overrides */
const BIKE_SUFFIXES = ['-rennrad', '-gravel', '-mtb', '-city']

function getBodyZone(itemId: string): BodyZone {
  // Direct lookup first
  if (ITEM_ZONE[itemId]) return ITEM_ZONE[itemId]
  // Strip bike-type suffix and retry
  for (const suffix of BIKE_SUFFIXES) {
    if (itemId.endsWith(suffix)) {
      const base = itemId.slice(0, -suffix.length)
      if (ITEM_ZONE[base]) return ITEM_ZONE[base]
    }
  }
  return 'other'
}

const zoneColors: Record<BodyZone, string> = {
  head: 'text-violet-500 dark:text-violet-400',
  eyes: 'text-sky-500 dark:text-sky-400',
  neck: 'text-teal-500 dark:text-teal-400',
  upperBody: 'text-emerald-500 dark:text-emerald-400',
  lowerBody: 'text-blue-500 dark:text-blue-400',
  hands: 'text-amber-500 dark:text-amber-400',
  feet: 'text-orange-500 dark:text-orange-400',
  other: 'text-stone-500 dark:text-stone-400',
}

interface ClothingListProps {
  items: ClothingItem[]
  productRecommendations?: ProductRecommendations
  onProductClick?: (productId: string) => void
}

export function ClothingList({ items, productRecommendations, onProductClick }: ClothingListProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  const shopMap = productRecommendations
    ? new Map(productRecommendations.shops.map((s) => [s.id, s]))
    : new Map()

  function findItemProduct(itemId: string): MatchedProduct | undefined {
    return productRecommendations?.matched[itemId]
  }

  // Group items by body zone
  const grouped = new Map<BodyZone, ClothingItem[]>()
  for (const item of items) {
    const zone = getBodyZone(item.id)
    if (!grouped.has(zone)) grouped.set(zone, [])
    grouped.get(zone)!.push(item)
  }

  // Sort zones by defined order, skip empty ones
  const sortedZones = ZONE_ORDER.filter((z) => grouped.has(z))

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden">
      {sortedZones.map((zone) => (
        <div key={zone}>
          <div className="px-5 pt-3 pb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${zoneColors[zone]}`}>
              {t(`report.clothing.zone.${zone}`)}
            </span>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {grouped.get(zone)!.map((item) => {
              const itemProduct = productRecommendations?.disclosure ? findItemProduct(item.id) : undefined
              const shop = itemProduct ? shopMap.get(itemProduct.shopId) : undefined

              return (
                <li key={item.id} className="px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.name}</p>
                    {item.reason && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.reason}</p>
                    )}
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-stone-400 dark:text-stone-500 italic">
                          {t('report.clothing.alternatives')}
                        </span>
                        {item.alternatives.map((alt) => (
                          <span
                            key={alt.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700"
                          >
                            {alt.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {itemProduct && shop && productRecommendations?.disclosure && (
                      <div className="mt-2">
                        <InlineProductLink
                          product={itemProduct}
                          shop={shop}
                          disclosure={productRecommendations.disclosure}
                          onProductClick={onProductClick}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
