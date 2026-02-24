import { ExternalLink, Store } from 'lucide-react'
import type { ReportProductsProps, Product, Shop } from './types'

function groupByCategory(products: Product[]): Record<string, Product[]> {
  const groups: Record<string, Product[]> = {}
  for (const p of products) {
    if (!groups[p.categoryId]) groups[p.categoryId] = []
    groups[p.categoryId].push(p)
  }
  return groups
}

function CompactProductCard({ product, shop, badgeLabel, onProductClick }: {
  product: Product
  shop: Shop | undefined
  badgeLabel: string
  onProductClick?: (id: string) => void
}) {
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: product.currency,
  }).format(product.price)

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => onProductClick?.(product.id)}
      className="group flex items-center gap-3 rounded-lg bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-3 hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-sm transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
        <Store className="w-6 h-6 text-stone-400 dark:text-stone-500" strokeWidth={1} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </p>
          <span className="px-1 py-px text-[8px] font-semibold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
            {badgeLabel}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          {product.matchesLabel} &middot; {product.weather.summary}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {formattedPrice}
          </span>
          {shop && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500">via {shop.name} *</span>
          )}
        </div>
      </div>

      <ExternalLink className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 shrink-0 transition-colors" strokeWidth={2} />
    </a>
  )
}

const categoryLabels: Record<string, string> = {
  'cat-jackets': 'Cycling jackets',
  'cat-gloves': 'Cycling gloves',
  'cat-pants': 'Cycling pants',
  'cat-headwear': 'Headwear',
  'cat-shoes': 'Cycling shoes & covers',
  'cat-lights': 'Bike lights',
  'cat-accessories': 'Accessories & equipment',
}

export function ReportProducts({ products, shops, disclosure, onProductClick }: ReportProductsProps) {
  if (products.length === 0) return null

  const shopMap = new Map(shops.map((s) => [s.id, s]))
  const grouped = groupByCategory(products)

  return (
    <section className="space-y-4">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Matching products
      </h2>

      {Object.entries(grouped).map(([categoryId, categoryProducts]) => (
        <div key={categoryId}>
          <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
            {categoryLabels[categoryId] ?? categoryId}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryProducts.map((product) => (
              <CompactProductCard
                key={product.id}
                product={product}
                shop={shopMap.get(product.shopId)}
                badgeLabel={disclosure.badgeLabel}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed pt-2 border-t border-stone-200 dark:border-stone-800">
        {disclosure.disclaimerText}
      </p>
    </section>
  )
}
