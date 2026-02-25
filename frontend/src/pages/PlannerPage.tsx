import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RidePlanner, RecentRides } from '../components/ride-planner'
import { RideReport, RideReportSkeleton } from '../components/ride-report'
import { useLocationSearch } from '../hooks/useLocationSearch'
import { useRideHistory } from '../hooks/useRideHistory'
import { usePlannerFormPersistence } from '../hooks/usePlannerFormPersistence'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import { fetchReport } from '../api/rides'
import { createRoute } from '../api/routes'
import { TurnstileWidget, useTurnstile } from '../components/common/TurnstileWidget'
import { products as sampleProducts, shops, disclosure } from '../data/sample-products'
import type { BikeTypeOption, RidingIntensityOption, QuickPreset, RideInput } from '../components/ride-planner/types'
import type { RideReport as RideReportType } from '../components/ride-report/types'
import type { RideHistoryEntry } from '../hooks/useRideHistory'

export default function PlannerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { isAuthenticated } = useAuth()

  const {
    suggestions,
    dayStopSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchDayStopLocation,
    useCurrentLocation,
    clearSuggestions,
    clearDetectedLocation,
  } = useLocationSearch()

  const { history, addEntry, removeEntry, clearHistory } = useRideHistory()
  const { savedFormState, saveFormState, clearFormState } = usePlannerFormPersistence()

  // Report state
  const [report, setReport] = useState<RideReportType | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [submittedInput, setSubmittedInput] = useState<RideInput | null>(null)
  const [currentRouteId, setCurrentRouteId] = useState<string | undefined>(undefined)

  // Save-route state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Track form reset key to force remount
  const [resetKey, setResetKey] = useState(0)

  // Submission ID to cancel stale doSubmit continuations after reset
  const submitIdRef = useRef(0)

  // Throttle-triggered CAPTCHA: show after THROTTLE_THRESHOLD submits in THROTTLE_WINDOW_MS
  const THROTTLE_THRESHOLD = 3
  const THROTTLE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
  const submitTimestamps = useRef<number[]>([])
  const [showPlannerCaptcha, setShowPlannerCaptcha] = useState(false)
  const plannerTurnstile = useTurnstile()

  const reportRef = useRef<HTMLDivElement>(null)

  // Check for incoming state from saved routes (RoutesPage)
  const routerState = location.state as { rideInput?: RideInput; routeId?: string } | null
  const incomingRideInput = routerState?.rideInput
  const incomingRouteId = routerState?.routeId
  const hasAutoSubmitted = useRef(false)

  const bikeTypeOptions: BikeTypeOption[] = [
    { value: 'rennrad', label: t('planner.bikeType.rennrad'), description: t('planner.bikeType.rennradDesc'), icon: 'gauge' },
    { value: 'gravel', label: t('planner.bikeType.gravel'), description: t('planner.bikeType.gravelDesc'), icon: 'mountain' },
    { value: 'mtb', label: t('planner.bikeType.mtb'), description: t('planner.bikeType.mtbDesc'), icon: 'trees' },
    { value: 'city', label: t('planner.bikeType.city'), description: t('planner.bikeType.cityDesc'), icon: 'building-2' },
  ]

  const intensityOptions: RidingIntensityOption[] = [
    { value: 'gemuetlich', label: t('planner.intensity.gemuetlich'), description: t('planner.intensity.gemuetlichDesc') },
    { value: 'moderat', label: t('planner.intensity.moderat'), description: t('planner.intensity.moderatDesc') },
    { value: 'sportlich', label: t('planner.intensity.sportlich'), description: t('planner.intensity.sportlichDesc') },
  ]

  const quickPresets: QuickPreset[] = [
    { id: 'p1', label: t('planner.preset.commute'), description: t('planner.preset.commuteDesc'), bikeType: 'city', intensity: 'gemuetlich', distanceKm: 12, isMultiDay: false },
    { id: 'p2', label: t('planner.preset.weekendTour'), description: t('planner.preset.weekendTourDesc'), bikeType: 'gravel', intensity: 'moderat', distanceKm: 50, isMultiDay: false },
    { id: 'p3', label: t('planner.preset.roadBikeRide'), description: t('planner.preset.roadBikeRideDesc'), bikeType: 'rennrad', intensity: 'sportlich', distanceKm: 80, isMultiDay: false },
    { id: 'p4', label: t('planner.preset.multiDayTrip'), description: t('planner.preset.multiDayTripDesc'), bikeType: 'gravel', intensity: 'gemuetlich', isMultiDay: true },
  ]

  // Core submit handler
  const doSubmit = useCallback(async (input: RideInput, routeId?: string) => {
    const currentSubmitId = ++submitIdRef.current
    setReportLoading(true)
    setReportError(null)
    setReport(null)
    setSubmittedInput(input)
    setCurrentRouteId(routeId)
    setSaved(false)
    saveFormState(input)

    try {
      const result = await fetchReport(input, routeId)
      // Bail out if a reset happened while the fetch was in flight
      if (submitIdRef.current !== currentSubmitId) return
      setReport(result)
      addEntry(input, result)
      // Scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      if (submitIdRef.current !== currentSubmitId) return
      setReportError(err instanceof Error ? err.message : t('report.error.fallback'))
    } finally {
      if (submitIdRef.current === currentSubmitId) {
        setReportLoading(false)
      }
    }
  }, [addEntry, saveFormState, t])

  const handleSubmit = (input: RideInput) => {
    const now = Date.now()
    // Prune old timestamps outside window
    submitTimestamps.current = submitTimestamps.current.filter(
      ts => now - ts < THROTTLE_WINDOW_MS
    )
    submitTimestamps.current.push(now)

    // Check if CAPTCHA is needed
    if (submitTimestamps.current.length > THROTTLE_THRESHOLD) {
      if (!showPlannerCaptcha) {
        setShowPlannerCaptcha(true)
        return // Don't submit yet — wait for CAPTCHA
      }
      const token = plannerTurnstile.getToken()
      if (!token) {
        return // CAPTCHA shown but not completed
      }
      doSubmit({ ...input, captchaToken: token })
    } else {
      doSubmit(input)
    }
  }

  // Auto-submit from router state (saved routes or redirected from /report)
  useEffect(() => {
    if (incomingRideInput && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true
      doSubmit(incomingRideInput, incomingRouteId)
      // Clear the router state so refreshing doesn't re-trigger
      window.history.replaceState({}, '')
    }
  }, [incomingRideInput, incomingRouteId, doSubmit])

  // Report action handlers
  const handleShare = () => {
    if (!report) return
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
        addToast(t('report.routeSaved'), 'success')
      })
      .catch(() => {
        addToast(t('report.routeSaveError'), 'error')
      })
      .finally(() => setSaving(false))
  }

  const handleSwapClothingItem = (_dayId: string, _itemId: string, _alternativeId: string) => {
    // TODO: Implement swap logic
  }

  const handleProductClick = (productId: string) => {
    const product = sampleProducts.find((p) => p.id === productId)
    if (product) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleRetry = () => {
    if (submittedInput) {
      doSubmit(submittedInput, currentRouteId)
    }
  }

  // Recent rides: select an entry → fill planner + auto-submit
  const handleHistorySelect = (entry: RideHistoryEntry) => {
    doSubmit(entry.rideInput)
  }

  const handleNavigateToLogin = () => {
    navigate('/login', { state: { from: '/planner' } })
  }

  // Determine initial values for the planner
  const getInitialValues = (): Partial<RideInput> | undefined => {
    if (incomingRideInput) return incomingRideInput
    if (detectedLocation) return { location: detectedLocation }
    if (savedFormState) return savedFormState
    return undefined
  }

  // Determine formSource for the info banner
  const getFormSource = (): 'restored' | 'route' | 'history' | null => {
    if (incomingRideInput && incomingRouteId) return 'route'
    if (incomingRideInput) return 'history'
    if (savedFormState && !detectedLocation) return 'restored'
    return null
  }

  // Reset form to fresh defaults
  const handleReset = () => {
    // Invalidate any in-flight fetchReport so its callbacks are ignored
    submitIdRef.current++
    setReport(null)
    setReportLoading(false)
    setReportError(null)
    setSubmittedInput(null)
    setCurrentRouteId(undefined)
    setSaved(false)
    setSaving(false)
    clearFormState()
    // Clear stale location search state so the new planner starts clean
    clearSuggestions()
    clearDetectedLocation()
    // Clear router state if any
    window.history.replaceState({}, '')
    // Increment reset key to force RidePlanner remount with fresh defaults
    setResetKey(k => k + 1)
  }

  // Increment a stable key exactly once per successful detection so
  // RidePlanner remounts with the detected location as initialValues.
  const detectKeyRef = useRef(0)
  const prevDetectedRef = useRef(detectedLocation)
  if (detectedLocation && detectedLocation !== prevDetectedRef.current) {
    detectKeyRef.current += 1
    prevDetectedRef.current = detectedLocation
  }

  // Determine if we should show the report section
  const showReport = reportLoading || reportError || report

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Ambient background */}
      {!showReport && (
        <>
          <div
            className="fixed inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(245,158,11,0.06) 0%, transparent 60%)',
            }}
          />
          <div className="fixed inset-0 -z-10 bg-stone-50 dark:bg-stone-950" />
        </>
      )}

      {/* Planner section */}
      {!showReport && (
        // Full planner form with recent rides inside
        <RidePlanner
          key={`form-${detectKeyRef.current}-${resetKey}`}
          initialValues={resetKey > 0 ? undefined : getInitialValues()}
          locationSuggestions={suggestions}
          dayStopLocationSuggestions={dayStopSuggestions}
          bikeTypeOptions={bikeTypeOptions}
          intensityOptions={intensityOptions}
          quickPresets={quickPresets}
          isLoading={isLocating || reportLoading}
          formSource={resetKey > 0 ? null : getFormSource()}
          onReset={getFormSource() && resetKey === 0 ? handleReset : undefined}
          onLocationSearch={searchLocation}
          onUseCurrentLocation={useCurrentLocation}
          onLocationSelect={() => { }}
          onDayStopLocationSearch={searchDayStopLocation}
          onPresetSelect={() => { }}
          onSubmit={handleSubmit}
        >
          {history.length > 0 && (
            <RecentRides
              history={history}
              onSelect={handleHistorySelect}
              onRemove={removeEntry}
              onClear={clearHistory}
              onNavigateToLogin={handleNavigateToLogin}
            />
          )}
          {showPlannerCaptcha && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t('planner.captchaHint', 'Please verify you\'re not a bot to continue.')}
              </p>
              <TurnstileWidget
                onVerify={plannerTurnstile.onVerify}
                onExpire={plannerTurnstile.onExpire}
              />
            </div>
          )}
        </RidePlanner>
      )}

      {/* Report section */}
      <div ref={reportRef}>
        {reportLoading && (
          <div className="max-w-4xl mx-auto px-4 pb-10">
            <RideReportSkeleton />
          </div>
        )}

        {reportError && !reportLoading && (
          <div className="text-center py-20">
            <h2
              className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('report.error.heading')}
            </h2>
            <p className="mt-2 text-stone-500 dark:text-stone-400">
              {reportError}
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {t('report.error.tryAgain')}
              </button>
              <button
                onClick={() => {
                  setReportError(null)
                  setReport(null)
                  setSubmittedInput(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                {t('report.error.backToPlanner')}
              </button>
            </div>
          </div>
        )}

        {report && !reportLoading && (
          <div className="max-w-4xl mx-auto px-4 pb-10">
            <RideReport
              report={report}
              onShare={handleShare}
              onSaveRoute={isAuthenticated ? handleSaveRoute : undefined}
              routeSaving={saving}
              routeSaved={saved}
              onPlanAgain={() => {
                setReport(null)
                setReportError(null)
                setSubmittedInput(null)
              }}
              onNewRide={handleReset}
              onSwapClothingItem={handleSwapClothingItem}
              products={sampleProducts}
              shops={shops}
              disclosure={disclosure}
              onProductClick={handleProductClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}
