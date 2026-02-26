import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RidePlanner, RecentRides } from '../components/ride-planner'
import { useLocationSearch } from '../hooks/useLocationSearch'
import { useRideHistory } from '../hooks/useRideHistory'
import { usePlannerFormPersistence } from '../hooks/usePlannerFormPersistence'
import { fetchRoute } from '../api/routes'

import { TurnstileWidget, useTurnstile } from '../components/common/TurnstileWidget'
import type { BikeTypeOption, RidingIntensityOption, QuickPreset, RideInput } from '../components/ride-planner/types'
import type { RideHistoryEntry } from '../hooks/useRideHistory'

export default function PlannerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { routeId: urlRouteId } = useParams<{ routeId?: string }>()
  const { t } = useTranslation()

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

  const { history, removeEntry, clearHistory } = useRideHistory()
  const { savedFormState, saveFormState, clearFormState } = usePlannerFormPersistence()

  // Track form reset key to force remount
  const [resetKey, setResetKey] = useState(0)

  // Submission state for loading indicator
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Throttle-triggered CAPTCHA: show after THROTTLE_THRESHOLD submits in THROTTLE_WINDOW_MS
  const THROTTLE_THRESHOLD = 3
  const THROTTLE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
  const submitTimestamps = useRef<number[]>([])
  const [showPlannerCaptcha, setShowPlannerCaptcha] = useState(false)
  const plannerTurnstile = useTurnstile()

  // Check for incoming state from navigation
  interface PlannerLocationState {
    prefillInput?: RideInput
    reset?: boolean
    rideInput?: RideInput  // legacy: from RoutesPage
    routeId?: string       // legacy: from RoutesPage
  }
  const routerState = location.state as PlannerLocationState | null
  const incomingPrefillInput = routerState?.prefillInput
  const incomingRideInput = routerState?.rideInput  // legacy
  const incomingRouteId = routerState?.routeId       // legacy
  const shouldReset = routerState?.reset
  const hasProcessedReset = useRef(false)
  const hasProcessedAutoSubmit = useRef(false)

  // Route loaded from URL param (for reload support)
  const [urlRouteInput, setUrlRouteInput] = useState<RideInput | null>(null)
  const urlRouteLoading = useRef(false)

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

  // Handle reset state from navigation
  useEffect(() => {
    if (shouldReset && !hasProcessedReset.current) {
      hasProcessedReset.current = true
      clearFormState()
      clearSuggestions()
      clearDetectedLocation()
      setResetKey(k => k + 1)
      // Clear the state so refresh doesn't re-trigger reset
      window.history.replaceState({}, '')
    }
  }, [shouldReset, clearFormState, clearSuggestions, clearDetectedLocation])

  // Submit handler - navigates to /report with input
  const doSubmit = useCallback((input: RideInput, routeId?: string) => {
    setIsSubmitting(true)
    saveFormState(input)
    // Navigate to report page with the input (history is added there after fetch succeeds)
    navigate('/report', { state: { input, routeId } })
  }, [navigate, saveFormState])

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

  // Auto-submit from router state (legacy: saved routes from RoutesPage)
  useEffect(() => {
    if (incomingRideInput && !hasProcessedAutoSubmit.current) {
      hasProcessedAutoSubmit.current = true
      doSubmit(incomingRideInput, incomingRouteId)
      // Clear the router state so refreshing doesn't re-trigger
      window.history.replaceState({}, '')
    }
  }, [incomingRideInput, incomingRouteId, doSubmit])

  // Load route from URL param on mount / page reload
  useEffect(() => {
    if (!urlRouteId || urlRouteLoading.current) return
    urlRouteLoading.current = true
    fetchRoute(urlRouteId)
      .then((route) => {
        const today = new Date().toISOString().slice(0, 10)
        const now = new Date()
        const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const input: RideInput = {
          location: { address: route.startLocation },
          startDate: today,
          startTime,
          endDate: null,
          isMultiDay: false,
          bikeType: 'rennrad',
          intensity: route.ridingStyle === 'Sporty' ? 'sportlich' : route.ridingStyle === 'Easy' ? 'gemuetlich' : 'moderat',
          distanceKm: route.totalDistance,
          dayStops: [],
        }
        setUrlRouteInput(input)
        doSubmit(input, urlRouteId)
      })
      .catch(() => {
        // Route not found or auth error — redirect to plain planner
        navigate('/planner', { replace: true })
      })
  }, [urlRouteId, doSubmit, navigate])

  // Recent rides: select an entry → navigate to report
  const handleHistorySelect = (entry: RideHistoryEntry) => {
    doSubmit(entry.rideInput)
  }

  const handleNavigateToLogin = () => {
    navigate('/login', { state: { from: '/planner' } })
  }

  // Determine initial values for the planner
  const getInitialValues = (): Partial<RideInput> | undefined => {
    if (incomingPrefillInput) return incomingPrefillInput
    if (incomingRideInput) return incomingRideInput
    if (urlRouteInput) return urlRouteInput
    if (detectedLocation) return { location: detectedLocation }
    if (savedFormState) return savedFormState
    return undefined
  }

  // Determine formSource for the info banner
  const getFormSource = (): 'restored' | 'route' | 'history' | null => {
    if (incomingPrefillInput) return 'history'
    if (incomingRideInput && incomingRouteId) return 'route'
    if (urlRouteId) return 'route'
    if (incomingRideInput) return 'history'
    if (savedFormState && !detectedLocation) return 'restored'
    return null
  }

  // Reset form to fresh defaults
  const handleReset = () => {
    clearFormState()
    clearSuggestions()
    clearDetectedLocation()
    // Navigate to clean planner URL (removes routeId from path)
    navigate('/planner', { replace: true, state: { reset: true } })
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

  return (
    <div className="">
      {/* Ambient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(245,158,11,0.06) 0%, transparent 60%)',
        }}
      />
      <div className="fixed inset-0 -z-10 bg-stone-50 dark:bg-stone-950" />

      {/* Planner form with recent rides inside */}
      <RidePlanner
        key={`form-${detectKeyRef.current}-${resetKey}`}
        initialValues={resetKey > 0 ? (detectedLocation ? { location: detectedLocation } : undefined) : getInitialValues()}
        locationSuggestions={suggestions}
        dayStopLocationSuggestions={dayStopSuggestions}
        bikeTypeOptions={bikeTypeOptions}
        intensityOptions={intensityOptions}
        quickPresets={quickPresets}
        isLoading={isLocating || isSubmitting}
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
    </div>
  )
}
