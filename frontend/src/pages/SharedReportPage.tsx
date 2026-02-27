import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RideReport, RideReportSkeleton } from '../components/ride-report'
import { fetchSharedReport } from '../api/shared'
// import { products as sampleProducts, shops, disclosure } from '../data/sample-products'
import type { RideReport as RideReportType } from '../components/ride-report/types'
import { MapPin, AlertTriangle } from 'lucide-react'

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [report, setReport] = useState<RideReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid share link')
      setLoading(false)
      return
    }

    fetchSharedReport(token)
      .then(setReport)
      .catch(() => setError(t('shared.error')))
      .finally(() => setLoading(false))
  }, [token, t])

  // const handleProductClick = (productId: string) => {
  //   const product = sampleProducts.find((p) => p.id === productId)
  //   if (product) {
  //     window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
  //   }
  // }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <RideReportSkeleton />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
          <AlertTriangle className="w-8 h-8 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('shared.notFound')}
        </h2>
        <p className="mt-2 text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          {t('shared.notFoundText')}
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <MapPin className="w-4 h-4" strokeWidth={1.5} />
          {t('shared.planYourOwn')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-10">
      {/* Shared badge */}
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
          {t('shared.badge')}
        </span>
      </div>

      <RideReport
        report={report}
      // products={sampleProducts}
      // shops={shops}
      // disclosure={disclosure}
      // onProductClick={handleProductClick}
      />

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
          {t('shared.cta')}
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <MapPin className="w-4 h-4" strokeWidth={1.5} />
          {t('shared.planYourOwn')}
        </button>
      </div>
    </div>
  )
}
