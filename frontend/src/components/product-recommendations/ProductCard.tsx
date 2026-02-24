import { ExternalLink, Store, Thermometer, CloudRain, Wind } from 'lucide-react'
import type { Product, Shop, AffiliateDisclosure } from './types'

interface ProductCardProps {
  product: Product
  shop: Shop
  disclosure: AffiliateDisclosure
  onProductClick?: (productId: string) => void
}

const precipitationLabels: Record<string, string> = {
  none: 'No protection',
  'light-rain': 'Water-resistant',
  'heavy-rain': 'Waterproof',
  snow: 'Snow & Rain',
}

const windLabels: Record<string, string> = {
  none: 'No protection',
  'light-wind': 'Light wind',
  'strong-wind': 'Windproof',
}

export function ProductCard({ product, shop, disclosure, onProductClick }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: product.currency,
  }).format(product.price)

  const { weather } = product

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => onProductClick?.(product.id)}
      className="group relative flex flex-col rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 overflow-hidden hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-md transition-all duration-200"
    >
      <span className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-700/40">
        {disclosure.badgeLabel}
      </span>

      <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500">
          <Store className="w-10 h-10" strokeWidth={1} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3.5">
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-1 truncate">
          {product.matchesLabel}
        </p>
        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 mb-2.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {weather.tempRange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 ring-1 ring-sky-200/60 dark:ring-sky-800/40">
              <Thermometer className="w-3 h-3" strokeWidth={2} />
              {weather.tempRange.min}–{weather.tempRange.max} {weather.tempRange.unit}
            </span>
          )}
          {weather.precipitation !== 'none' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40">
              <CloudRain className="w-3 h-3" strokeWidth={2} />
              {precipitationLabels[weather.precipitation]}
            </span>
          )}
          {weather.wind !== 'none' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200/60 dark:ring-violet-800/40">
              <Wind className="w-3 h-3" strokeWidth={2} />
              {windLabels[weather.wind]}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p
              className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {formattedPrice}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              via {shop.name} *
            </p>
          </div>
          <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        </div>
      </div>
    </a>
  )
}
