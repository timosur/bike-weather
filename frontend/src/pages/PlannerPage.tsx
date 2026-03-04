import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RidePlanner, RecentRides, GpxImportModal } from '../components/ride-planner'
import type { GpxImportData } from '../components/ride-planner'
import { UnsavedChangesDialog } from '../components/common/UnsavedChangesDialog'
import { useLocationSearch } from '../hooks/useLocationSearch'
import { useRideHistory } from '../hooks/useRideHistory'
import { useNavigationGuard } from '../hooks/useNavigationGuard'
import { usePlannerFormPersistence } from '../hooks/usePlannerFormPersistence'
import { SEO } from '../hooks/useSEO'
import { JsonLd } from '../components/seo'
import { fetchRoute } from '../api/routes'

import { TurnstileWidget, useTurnstile } from '../components/common/TurnstileWidget'
import type { BikeTypeOption, RidingIntensityOption, RideInput } from '../components/ride-planner/types'
import type { RideHistoryEntry } from '../hooks/useRideHistory'

export default function PlannerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { routeId: urlRouteId } = useParams<{ routeId?: string }>()
  const { t } = useTranslation()

  const {
    suggestions,
    waypointSuggestions,
    destinationSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchWaypointLocation,
    searchDestination,
    useCurrentLocation,
    clearSuggestions,
    clearDetectedLocation,
  } = useLocationSearch()

  const { history, removeEntry, clearHistory } = useRideHistory()
  const { saveFormState, clearFormState } = usePlannerFormPersistence()

  // Track form reset key to force remount
  const [resetKey, setResetKey] = useState(0)

  // Submission state for loading indicator
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit mode state (for routes with stored rideInput)
  const [editRouteId, setEditRouteId] = useState<string | null>(null)
  const [editOriginalInput, setEditOriginalInput] = useState<RideInput | null>(null)

  // GPX import modal state
  const [gpxModalOpen, setGpxModalOpen] = useState(false)

  // Throttle-triggered CAPTCHA: show after THROTTLE_THRESHOLD submits in THROTTLE_WINDOW_MS
  const THROTTLE_THRESHOLD = 3
  const THROTTLE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
  const submitTimestamps = useRef<number[]>([])
  const [showPlannerCaptcha, setShowPlannerCaptcha] = useState(false)
  const plannerTurnstile = useTurnstile()

  // Track form dirty state for navigation blocking
  const [isFormDirty, setIsFormDirty] = useState(false)
  const isSubmittingRef = useRef(false)

  // Block navigation when form is dirty (but allow if submitting)
  const navGuard = useNavigationGuard(isFormDirty && !isSubmittingRef.current)

  // Check for incoming state from navigation
  interface PlannerLocationState {
    prefillInput?: RideInput
    editInput?: RideInput   // passed from ReportPage "Edit Ride" button
    reset?: boolean
    rideInput?: RideInput  // legacy: from RoutesPage
    routeId?: string       // legacy: from RoutesPage
  }
  const routerState = location.state as PlannerLocationState | null
  const incomingPrefillInput = routerState?.prefillInput
  const incomingEditInput = routerState?.editInput    // from "Edit Ride"
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

  // Handle reset state from navigation
  useEffect(() => {
    if (shouldReset && !hasProcessedReset.current) {
      hasProcessedReset.current = true
      clearFormState()
      clearSuggestions()
      clearDetectedLocation()
      // Also clear edit mode on reset
      setEditRouteId(null)
      setEditOriginalInput(null)
      setResetKey(k => k + 1)
      // Clear the state so refresh doesn't re-trigger reset
      window.history.replaceState({}, '')
    }
  }, [shouldReset, clearFormState, clearSuggestions, clearDetectedLocation])

  // Submit handler - navigates to /report with input
  const doSubmit = useCallback((input: RideInput, routeId?: string, originalInput?: RideInput) => {
    isSubmittingRef.current = true
    setIsSubmitting(true)
    saveFormState(input)
    // Navigate to report page with the input
    // Pass originalInput for change detection when editing an existing route
    const targetRouteId = routeId ?? editRouteId
    const targetPath = targetRouteId ? `/report/${targetRouteId}` : '/report'
    // isEdit=true when we have edit context (prevents duplicate history entry)
    const isEdit = !!(editRouteId || editOriginalInput || originalInput)
    navigate(targetPath, {
      state: {
        input,
        routeId: targetRouteId,
        originalInput: originalInput ?? editOriginalInput,
        isEdit,
      }
    })
  }, [navigate, saveFormState, editRouteId, editOriginalInput])

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

    // If we received the input via navigation state (from "Edit Ride" button),
    // use it directly to enter edit mode — no API fetch needed.
    if (incomingEditInput) {
      setEditRouteId(urlRouteId)
      setEditOriginalInput(incomingEditInput)
      setUrlRouteInput(incomingEditInput)
      // Clear the state so refresh triggers a fresh fetch
      window.history.replaceState({}, '')
      return
    }

    fetchRoute(urlRouteId)
      .then((route) => {
        // If route has stored rideInput, enter edit mode (don't auto-submit)
        if (route.rideInput) {
          setEditRouteId(urlRouteId)
          setEditOriginalInput(route.rideInput)
          setUrlRouteInput(route.rideInput)
          // Don't auto-submit — user will see the form and can modify before submitting
        } else {
          // Legacy route without rideInput: reconstruct minimal input and auto-submit
          const today = new Date().toISOString().slice(0, 10)
          const now = new Date()
          const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const input: RideInput = {
            location: { address: route.startLocation },
            startDate: today,
            startTime,
            bikeType: 'rennrad',
            intensity: route.ridingStyle === 'Sporty' ? 'sportlich' : route.ridingStyle === 'Easy' ? 'gemuetlich' : 'moderat',
            distanceKm: route.totalDistance,
            waypoints: [],
            destination: null,
          }
          setUrlRouteInput(input)
          doSubmit(input, urlRouteId)
        }
      })
      .catch(() => {
        // Route not found or auth error — redirect to plain planner
        navigate('/planner', { replace: true })
      })
  }, [urlRouteId, incomingEditInput, doSubmit, navigate])

  // Recent rides: select an entry → navigate to report
  const handleHistorySelect = (entry: RideHistoryEntry) => {
    doSubmit(entry.rideInput)
  }

  // Determine initial values for the planner
  const getInitialValues = (): Partial<RideInput> | undefined => {
    if (editOriginalInput) return editOriginalInput  // edit mode uses stored rideInput
    if (incomingPrefillInput) return incomingPrefillInput
    if (incomingRideInput) return incomingRideInput
    if (urlRouteInput) return urlRouteInput
    if (detectedLocation) return { location: detectedLocation }
    return undefined
  }

  // Determine formSource for the info banner
  const getFormSource = (): 'restored' | 'route' | 'history' | null => {
    if (editRouteId) return 'route'  // edit mode shows as route source
    if (incomingPrefillInput) return 'history'
    if (incomingRideInput && incomingRouteId) return 'route'
    if (urlRouteId) return 'route'
    if (incomingRideInput) return 'history'
    return null
  }

  // Reset form to fresh defaults
  const handleReset = () => {
    clearFormState()
    clearSuggestions()
    clearDetectedLocation()
    // Clear edit mode
    setEditRouteId(null)
    setEditOriginalInput(null)
    // Navigate to clean planner URL (removes routeId from path)
    navigate('/planner', { replace: true, state: { reset: true } })
    // Increment reset key to force RidePlanner remount with fresh defaults
    setResetKey(k => k + 1)
  }

  // GPX import: pre-fill the form with imported route data
  const handleGpxImport = (data: GpxImportData) => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const importedInput: Partial<RideInput> = {
      location: data.startLocation.address
        ? { address: data.startLocation.address, lat: data.startLocation.lat, lon: data.startLocation.lon }
        : { address: `${data.startLocation.lat.toFixed(4)}, ${data.startLocation.lon.toFixed(4)}`, lat: data.startLocation.lat, lon: data.startLocation.lon },
      destination: data.endLocation.address
        ? { address: data.endLocation.address, lat: data.endLocation.lat, lon: data.endLocation.lon }
        : { address: `${data.endLocation.lat.toFixed(4)}, ${data.endLocation.lon.toFixed(4)}`, lat: data.endLocation.lat, lon: data.endLocation.lon },
      distanceKm: Math.round(data.distanceKm * 10) / 10,
      importedGeometry: data.geometry,
      startDate: today,
      startTime,
    }

    // Clear edit mode, set imported values, remount form
    setEditRouteId(null)
    setEditOriginalInput(null)
    navigate('/planner', { replace: true })
    setResetKey(k => k + 1)
    // Store imported input so getInitialValues picks it up after remount
    setUrlRouteInput(importedInput as RideInput)
  }

  return (
    <div className="">
      <SEO titleKey="planner" path="/planner" />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: t('shell.brand'),
        description: t('seo.planner.description'),
        url: 'https://bike-weather.com',
        applicationCategory: 'WeatherApplication',
        operatingSystem: 'All',
      }} />
      
      {/* Unsaved changes dialog */}
      {navGuard.isBlocked && (
        <UnsavedChangesDialog
          canSave={false}
          onDiscard={() => navGuard.proceed()}
          onCancel={() => navGuard.reset()}
        />
      )}
      
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
        key={`form-${resetKey}-${editRouteId ?? ''}`}
        initialValues={resetKey > 0 ? undefined : getInitialValues()}
        detectedLocation={detectedLocation}
        locationSuggestions={suggestions}
        waypointLocationSuggestions={waypointSuggestions}
        bikeTypeOptions={bikeTypeOptions}
        intensityOptions={intensityOptions}
        isLoading={isLocating || isSubmitting}
        formSource={resetKey > 0 ? null : getFormSource()}
        onReset={getFormSource() && resetKey === 0 ? handleReset : undefined}
        onLocationSearch={searchLocation}
        onUseCurrentLocation={useCurrentLocation}
        onLocationSelect={() => { }}
        onWaypointLocationSearch={searchWaypointLocation}
        onDestinationSearch={searchDestination}
        destinationSuggestions={destinationSuggestions}
        onSubmit={handleSubmit}
        onDirtyChange={setIsFormDirty}
        onGpxImport={() => setGpxModalOpen(true)}
      >
        {history.length > 0 && (
          <RecentRides
            history={history}
            onSelect={handleHistorySelect}
            onRemove={removeEntry}
            onClear={clearHistory}
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

      <GpxImportModal
        open={gpxModalOpen}
        onClose={() => setGpxModalOpen(false)}
        onImport={handleGpxImport}
      />
    </div>
  )
}
