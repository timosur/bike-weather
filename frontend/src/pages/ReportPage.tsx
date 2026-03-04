import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RideReport, RideReportSkeleton } from '../components/ride-report'
import { UnsavedChangesDialog } from '../components/common/UnsavedChangesDialog'
import { SEO } from '../hooks/useSEO'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import { useRideHistory } from '../hooks/useRideHistory'
import { useNavigationGuard } from '../hooks/useNavigationGuard'
import { fetchReport } from '../api/rides'
import { createRoute, fetchRoute, updateRoute } from '../api/routes'
// import { products as sampleProducts, shops, disclosure } from '../data/sample-products'
import type { RideInput } from '../components/ride-planner/types'
import type { RideReport as RideReportType } from '../components/ride-report/types'

interface ReportLocationState {
  input: RideInput
  routeId?: string
  originalInput?: RideInput  // For edit mode change detection
  isEdit?: boolean           // True when returning from edit (skip history entry)
}

/** Deep comparison of RideInput for change detection (ignores captchaToken) */
function hasInputChanged(current: RideInput, original: RideInput): boolean {
  const normalize = (input: RideInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { captchaToken, ...rest } = input
    return JSON.stringify(rest)
  }
  return normalize(current) !== normalize(original)
}

export default function ReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { routeId: urlRouteId } = useParams<{ routeId?: string }>()
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
  const { isAuthenticated } = useAuth()
  const { addEntry } = useRideHistory()

  // Extract navigation state
  const locationState = location.state as ReportLocationState | null
  const inputFromState = locationState?.input
  const routeIdFromState = locationState?.routeId ?? urlRouteId
  const originalInputFromState = locationState?.originalInput
  const isEditFromState = locationState?.isEdit ?? false

  // Report state
  const [report, setReport] = useState<RideReportType | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)
  const [submittedInput, setSubmittedInput] = useState<RideInput | null>(inputFromState ?? null)
  const [currentRouteId, setCurrentRouteId] = useState<string | undefined>(routeIdFromState)

  // Edit mode state (for save changes)
  const [editOriginalInput, setEditOriginalInput] = useState<RideInput | null>(originalInputFromState ?? null)
  const [saveChangesLoading, setSaveChangesLoading] = useState(false)

  // Save-route state (for new routes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!urlRouteId)

  // Fetch tracking
  const hasFetched = useRef(false)
  const fetchIdRef = useRef(0)
  const routeLoadedRef = useRef(false)

  // Detect if there are unsaved changes (edit mode)
  const hasUnsavedChanges = useMemo(() => {
    if (!editOriginalInput || !submittedInput) return false
    return hasInputChanged(submittedInput, editOriginalInput)
  }, [submittedInput, editOriginalInput])

  // Block navigation when there are unsaved changes
  const navGuard = useNavigationGuard(hasUnsavedChanges)

  // Handle saving changes when user chooses "Save & Leave"
  const handleBlockerSave = async () => {
    if (!currentRouteId || !submittedInput || !report) return
    
    setSaveChangesLoading(true)
    try {
      await updateRoute(currentRouteId, {
        name: report.rideName,
        start_location: report.startLocation,
        total_distance: report.totalDistance,
        riding_style: report.ridingStyle,
        ride_input: submittedInput,
      })
      setEditOriginalInput(submittedInput)
      addToast(t('report.changesSaved'), 'success')
      navGuard.proceed()
    } catch {
      addToast(t('report.saveChangesError'), 'error')
      // Stay on page after error
      navGuard.reset()
    } finally {
      setSaveChangesLoading(false)
    }
  }

  // Fetch report
  const doFetch = useCallback(async (input: RideInput, routeId?: string, skipHistory?: boolean) => {
    const currentFetchId = ++fetchIdRef.current
    setReportLoading(true)
    setReportError(null)
    setReport(null)

    try {
      const result = await fetchReport(input, routeId)
      if (fetchIdRef.current !== currentFetchId) return
      setReport(result)
      // Only add to history for new rides (not saved routes, not edits)
      if (!routeId && !skipHistory) {
        addEntry(input, result)
      }
    } catch (err) {
      if (fetchIdRef.current !== currentFetchId) return
      setReportError(err instanceof Error ? err.message : t('report.error.fallback'))
    } finally {
      if (fetchIdRef.current === currentFetchId) {
        setReportLoading(false)
      }
    }
  }, [t, addEntry])

  // Load route from URL param if no navigation state
  useEffect(() => {
    if (urlRouteId && !inputFromState && !routeLoadedRef.current) {
      routeLoadedRef.current = true
      setReportLoading(true)
      fetchRoute(urlRouteId)
        .then((route) => {
          // If route has stored rideInput, use that and set up edit mode
          if (route.rideInput) {
            setSubmittedInput(route.rideInput)
            setEditOriginalInput(route.rideInput)
            hasFetched.current = true
            doFetch(route.rideInput, urlRouteId)
          } else {
            // Legacy route without rideInput: reconstruct minimal input
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
            setSubmittedInput(input)
            hasFetched.current = true
            doFetch(input, urlRouteId)
          }
        })
        .catch(() => {
          navigate('/planner', { replace: true })
        })
    }
  }, [urlRouteId, inputFromState, navigate, doFetch])

  // Redirect to planner if no input state and no URL route ID
  useEffect(() => {
    if (!inputFromState && !urlRouteId) {
      navigate('/planner', { replace: true })
    }
  }, [inputFromState, urlRouteId, navigate])

  // Fetch from navigation state
  useEffect(() => {
    if (inputFromState && !hasFetched.current) {
      hasFetched.current = true
      doFetch(inputFromState, routeIdFromState, isEditFromState)
    }
  }, [inputFromState, routeIdFromState, isEditFromState, doFetch])

  // Re-fetch report when language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      if (submittedInput && report) {
        doFetch(submittedInput, currentRouteId)
      }
    }
    i18n.on('languageChanged', handleLanguageChanged)
    return () => { i18n.off('languageChanged', handleLanguageChanged) }
  }, [i18n, submittedInput, currentRouteId, report, doFetch])

  const handleSaveRoute = () => {
    if (!report || saving || saved || !submittedInput) return
    setSaving(true)
    createRoute({
      name: report.rideName,
      start_location: report.startLocation,
      total_distance: report.totalDistance,
      distance_unit: report.distanceUnit,
      riding_style: report.ridingStyle,
      ride_input: submittedInput,
    })
      .then((route) => {
        setSaved(true)
        setCurrentRouteId(route.id)
        setEditOriginalInput(submittedInput) // Now this is the original for future edits
        // Update URL to include route ID so refresh preserves data
        // Pass state so the component doesn't re-fetch and lose edit context
        navigate(`/report/${route.id}`, {
          replace: true,
          state: {
            input: submittedInput,
            routeId: route.id,
            originalInput: submittedInput,
          },
        })
        addToast(t('report.routeSaved'), 'success')
      })
      .catch(() => {
        addToast(t('report.routeSaveError'), 'error')
      })
      .finally(() => setSaving(false))
  }

  // Save changes to an existing route (edit mode)
  const handleSaveChanges = async () => {
    if (!currentRouteId || !submittedInput || !report || saveChangesLoading) return

    setSaveChangesLoading(true)
    try {
      await updateRoute(currentRouteId, {
        name: report.rideName,
        start_location: report.startLocation,
        total_distance: report.totalDistance,
        riding_style: report.ridingStyle,
        ride_input: submittedInput,
      })
      setEditOriginalInput(submittedInput) // Update original so change detection resets
      addToast(t('report.changesSaved'), 'success')
    } catch {
      addToast(t('report.saveChangesError'), 'error')
    } finally {
      setSaveChangesLoading(false)
    }
  }

  const handleSwapClothingItem = (dayId: string, itemId: string, alternativeId: string) => {
    if (!report) return

    setReport((prev) => {
      if (!prev) return prev

      const updatedDays = prev.days.map((day) => {
        if (day.id !== dayId) return day

        const updatedItems = day.clothingItems.map((item) => {
          if (item.id !== itemId) return item

          const alt = item.alternatives?.find((a) => a.id === alternativeId)
          if (!alt) return item

          const originalAsAlt = { id: item.id, name: item.name, icon: item.icon }
          const remainingAlts = (item.alternatives ?? []).filter((a) => a.id !== alternativeId)

          return {
            ...item,
            name: alt.name,
            icon: alt.icon,
            alternatives: [originalAsAlt, ...remainingAlts],
          }
        })

        return { ...day, clothingItems: updatedItems }
      })

      return { ...prev, days: updatedDays }
    })
  }

  // const handleProductClick = (productId: string) => {
  //   const product = sampleProducts.find((p) => p.id === productId)
  //   if (product) {
  //     window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
  //   }
  // }

  const handleRetry = () => {
    if (submittedInput) {
      hasFetched.current = false
      doFetch(submittedInput, currentRouteId)
    }
  }

  // "Edit Ride" - go back to planner with route ID in URL
  const handleEditRide = () => {
    if (currentRouteId) {
      // Navigate to planner with route ID and pass current input via state
      // so planner can enter edit mode even if ride_input isn't stored in DB yet
      navigate(`/planner/${currentRouteId}`, {
        state: {
          editInput: submittedInput,
        }
      })
    } else {
      // No saved route yet — just go back to planner with the current input
      navigate('/planner', {
        state: {
          prefillInput: submittedInput,
        }
      })
    }
  }

  // "New Ride" - go back to fresh planner
  const handleNewRide = () => {
    navigate('/planner', { state: { reset: true } })
  }

  const handleNavigateToLogin = () => {
    navigate('/login', { state: { from: location.pathname } })
  }

  // Determine if we're in edit mode (route exists with stored rideInput)
  const isEditMode = !!currentRouteId && !!editOriginalInput

  // Early return if no input and no URL route ID - will redirect
  if (!inputFromState && !urlRouteId) {
    return null
  }

  return (
    <div className="w-full overflow-x-hidden">
      <SEO titleKey="report" path="/report" noIndex />
      
      {/* Unsaved changes dialog */}
      {navGuard.isBlocked && (
        <UnsavedChangesDialog
          canSave={isEditMode && isAuthenticated}
          onSave={handleBlockerSave}
          onDiscard={() => navGuard.proceed()}
          onCancel={() => navGuard.reset()}
          saving={saveChangesLoading}
        />
      )}
      
      {reportLoading && (
        <div className="w-full max-w-4xl mx-auto px-4 pb-10">
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
              onClick={handleNewRide}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {t('report.error.backToPlanner')}
            </button>
          </div>
        </div>
      )}

      {report && !reportLoading && (
        <div className="w-full max-w-4xl mx-auto px-4 pb-10">
          <RideReport
            report={report}
            onSaveRoute={isAuthenticated && !saved && !currentRouteId ? handleSaveRoute : undefined}
            routeSaving={saving}
            routeSaved={saved || !!currentRouteId}
            onLoginToSave={!isAuthenticated && !currentRouteId ? handleNavigateToLogin : undefined}
            onEditRide={submittedInput ? handleEditRide : undefined}
            onNewRide={handleNewRide}
            onSaveChanges={isEditMode && isAuthenticated ? handleSaveChanges : undefined}
            saveChangesLoading={saveChangesLoading}
            hasUnsavedChanges={hasUnsavedChanges}
            onSwapClothingItem={handleSwapClothingItem}
          // products={sampleProducts}
          // shops={shops}
          // disclosure={disclosure}
          // onProductClick={handleProductClick}
          />
        </div>
      )}
    </div>
  )
}
