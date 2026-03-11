import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { fetchZonesForBikeType, fetchBikeTypes } from '../api/products'
import { ProductBreadcrumb } from '../components/product-recommendations/ProductBreadcrumb'
import { CategoryIcon } from '../components/product-recommendations'
import type { Zone, BikeType, CategoryIcon as CategoryIconType } from '../components/product-recommendations/types'
import { SkeletonBlock, SkeletonLine, SkeletonCard } from '@/components/skeleton'

export default function ProductZonePage() {
  const { t, i18n } = useTranslation()
  const { bikeType } = useParams<{ bikeType: string }>()
  const navigate = useNavigate()
  const [zones, setZones] = useState<Zone[]>([])
  const [bikeTypeName, setBikeTypeName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!bikeType) return
    if (zones.length === 0) setLoading(true)

    Promise.all([
      fetchZonesForBikeType(bikeType),
      fetchBikeTypes(),
    ])
      .then(([zoneData, btData]) => {
        setZones(zoneData)
        const bt = btData.find((b: BikeType) => b.id === bikeType)
        setBikeTypeName(bt?.name ?? bikeType)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [bikeType, i18n.language])

  if (loading && zones.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
        <SkeletonLine className="h-3 w-48" />
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonLine className="h-3 w-72" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-6 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SkeletonCard className="p-3 h-14" />
              <SkeletonCard className="p-3 h-14" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('products.categoryNotFound')}
        </h1>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          {t('products.browse.backToBikeTypes')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ProductBreadcrumb
        items={[
          { label: t('products.bikeTypes.heading'), href: '/products' },
          { label: bikeTypeName },
        ]}
        onNavigate={(href) => navigate(href)}
      />

      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('products.zones.heading')}
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          {t('products.zones.subheading', { bikeType: bikeTypeName })}
        </p>
      </div>

      <div className="space-y-6">
        {zones.map((zone) => {
          const hasProducts = zone.productCount > 0
          return (
            <div key={zone.id}>
              <div className="flex items-center gap-2 mb-2">
                <h2
                  className={`text-base font-semibold tracking-tight ${hasProducts
                      ? 'text-stone-900 dark:text-stone-100'
                      : 'text-stone-400 dark:text-stone-600'
                    }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {zone.name}
                </h2>
                <span className={`text-xs ${hasProducts
                    ? 'text-stone-400 dark:text-stone-500'
                    : 'text-stone-300 dark:text-stone-700'
                  }`}>
                  {zone.productCount} {zone.productCount === 1 ? t('products.productCountOne') : t('products.productCount')}
                </span>
              </div>

              {!hasProducts ? (
                <p className="text-xs text-stone-400 dark:text-stone-600 italic pl-1">
                  {t('products.zones.emptyZone')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zone.categories
                    .filter((cat) => cat.productCount > 0)
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          navigate(`/products/${bikeType}/${zone.id}/${cat.id}`)
                        }
                        className="group flex items-center gap-3 rounded-lg bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-3 text-left hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                          <CategoryIcon icon={cat.icon as CategoryIconType} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {cat.productCount} {cat.productCount === 1 ? t('products.productCountOne') : t('products.productCount')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 shrink-0" strokeWidth={2} />
                      </button>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
