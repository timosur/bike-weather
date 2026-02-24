import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RideReport, RideReportSkeleton } from '../components/ride-report'
import type { RideReport as RideReportType } from '../components/ride-report/types'
import type { RideInput } from '../components/ride-planner/types'
import { products as sampleProducts, shops, disclosure } from '../data/sample-products'
import { fetchReport } from '../api/rides'
import { createRoute } from '../api/routes'
import { useToast } from '../hooks/useToast'

export default function ReportPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { rideInput?: RideInput; routeId?: string } | null
  const rideInput = state?.rideInput
  const routeId = state?.routeId

  const { addToast } = useToast()
  const [report, setReport] = useState<RideReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!rideInput) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetchReport(rideInput, routeId)
      .then(setReport)
      .catch((err) => setError(err.message || 'Failed to load weather report'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // No ride input
  if (!rideInput) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          No ride data
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          Plan a ride first to see your weather report.
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          Go to Planner
        </button>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return <RideReportSkeleton />
  }

  // Error state
  if (error || !report) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Could not load report
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          {error || 'Something went wrong. Please try again.'}
        </p>
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              fetchReport(rideInput, routeId)
                .then(setReport)
                .catch((err) => setError(err.message || 'Failed to load weather report'))
                .finally(() => setLoading(false))
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Back to Planner
          </button>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: report.rideName, url: window.location.href }).catch(() => { })
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => { })
    }
  }

  const handleSaveRoute = () => {
    if (!report || saving || saved) return
    setSaving(true)
    createRoute({
      name: report.rideName,
      start_location: report.startLocation,
      total_distance: report.totalDistance,
      distance_unit: report.distanceUnit,
      riding_style: report.ridingStyle,
    })
      .then(() => {
        setSaved(true)
        addToast('Route gespeichert', 'success')
      })
      .catch(() => {
        addToast('Route konnte nicht gespeichert werden', 'error')
      })
      .finally(() => setSaving(false))
  }

  const handleSwapClothingItem = (_dayId: string, _itemId: string, _alternativeId: string) => {
    // TODO: Implement swap logic — replace item in report state
  }

  const handleProductClick = (productId: string) => {
    const product = sampleProducts.find((p) => p.id === productId)
    if (product) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <RideReport
      report={report}
      onShare={handleShare}
      onSaveRoute={handleSaveRoute}
      routeSaving={saving}
      routeSaved={saved}
      onSwapClothingItem={handleSwapClothingItem}
      products={sampleProducts}
      shops={shops}
      disclosure={disclosure}
      onProductClick={handleProductClick}
    />
  )
}
