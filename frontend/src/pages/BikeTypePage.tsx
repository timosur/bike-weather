import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Bike } from 'lucide-react'
import { fetchBikeTypes } from '../api/products'
import type { BikeType } from '../components/product-recommendations/types'
import { SkeletonBlock, SkeletonLine, SkeletonCard } from '@/components/skeleton'

const BIKE_TYPE_ICONS: Record<string, string> = {
  rennrad: '🚴',
  gravel: '🏔️',
  mtb: '⛰️',
  city: '🏙️',
}

export default function BikeTypePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [bikeTypes, setBikeTypes] = useState<BikeType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bikeTypes.length === 0) setLoading(true)
    fetchBikeTypes()
      .then(setBikeTypes)
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading && bikeTypes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonLine className="h-3 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} className="flex items-center gap-4 p-5">
              <SkeletonBlock className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-5 w-28" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('products.bikeTypes.heading')}
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          {t('products.bikeTypes.subheading')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bikeTypes.map((bt) => (
          <button
            key={bt.id}
            onClick={() => navigate(`/products/${bt.id}`)}
            className="group flex items-center gap-4 rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-5 text-left hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              {BIKE_TYPE_ICONS[bt.id] ? (
                <span className="text-2xl">{BIKE_TYPE_ICONS[bt.id]}</span>
              ) : (
                <Bike className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {bt.name}
              </h3>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  )
}
