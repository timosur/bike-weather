import { ChevronRight } from 'lucide-react'
import type { ProductCategoriesProps } from '../types'
import { CategoryIcon } from './CategoryIcon'

export function ProductCategories({ categories, onCategorySelect }: ProductCategoriesProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Products
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Recommended gear and clothing for every weather condition.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className="group flex items-center gap-4 rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-4 text-left hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-md transition-all duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <CategoryIcon icon={category.icon} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {category.name}
              </h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  )
}
