import { useState } from 'react'
import { ArrowLeft, Info, Thermometer, CloudRain, Wind } from 'lucide-react'
import type { ProductCategoryDetailProps, Product } from './types'
import { CategoryIcon } from './CategoryIcon'
import { ProductCard } from './ProductCard'

type WeatherFilter = 'all' | 'cold' | 'mild' | 'warm' | 'rain' | 'wind'

const filterConfig: { id: WeatherFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: null },
  { id: 'cold', label: '< 5 °C', icon: <Thermometer className="w-3 h-3" strokeWidth={2} /> },
  { id: 'mild', label: '5–15 °C', icon: <Thermometer className="w-3 h-3" strokeWidth={2} /> },
  { id: 'warm', label: '> 15 °C', icon: <Thermometer className="w-3 h-3" strokeWidth={2} /> },
  { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3 h-3" strokeWidth={2} /> },
  { id: 'wind', label: 'Wind', icon: <Wind className="w-3 h-3" strokeWidth={2} /> },
]

function matchesFilter(product: Product, filter: WeatherFilter): boolean {
  const { weather } = product
  switch (filter) {
    case 'all':
      return true
    case 'cold':
      return weather.tempRange != null && weather.tempRange.min <= 5
    case 'mild':
      return weather.tempRange != null && weather.tempRange.min <= 15 && weather.tempRange.max >= 5
    case 'warm':
      return weather.tempRange != null && weather.tempRange.max >= 15
    case 'rain':
      return weather.precipitation === 'heavy-rain' || weather.precipitation === 'snow'
    case 'wind':
      return weather.wind === 'strong-wind'
  }
}

export function ProductCategoryDetail({
  category,
  products,
  shops,
  disclosure,
  onProductClick,
  onBack,
}: ProductCategoryDetailProps) {
  const [activeFilter, setActiveFilter] = useState<WeatherFilter>('all')

  const filteredProducts = products.filter((p) => matchesFilter(p, activeFilter))

  function getShop(shopId: string) {
    return shops.find((s) => s.id === shopId) ?? shops[0]
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onBack?.()}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All categories
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CategoryIcon icon={category.icon} className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {category.name}
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filterConfig.map((filter) => {
          const isActive = activeFilter === filter.id
          const count = filter.id === 'all' ? products.length : products.filter((p) => matchesFilter(p, filter.id)).length
          if (filter.id !== 'all' && count === 0) return null

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 ring-1 ring-stone-200 dark:ring-stone-700 hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              {filter.icon}
              {filter.label}
              <span className={`text-[10px] ${isActive ? 'text-emerald-200 dark:text-emerald-200' : 'text-stone-400 dark:text-stone-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              shop={getShop(product.shopId)}
              disclosure={disclosure}
              onProductClick={onProductClick}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-10 text-center">
          <p className="text-sm text-stone-400 dark:text-stone-500">
            No products for this weather in this category.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-stone-100 dark:bg-stone-900 px-3.5 py-3 text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
        <p>{disclosure.disclaimerText}</p>
      </div>
    </div>
  )
}
