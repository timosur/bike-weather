import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Clock,
  Route,
  ChevronDown,
  Loader2,
  Gauge,
  Mountain,
  Trees,
  Building2,
  ArrowUpRight,
  Timer,
  Zap,
  RotateCcw,
  Info,
  X,
  Import,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  RidePlannerProps,
  RideInput,
  BikeType,
  RidingIntensity,
  GravelStyle,
  LocationSuggestion,
  Waypoint,
} from './types'
import { WaypointList } from './WaypointList'
import { LocationPicker } from './LocationPicker'
import { fetchRoutePreview, type RoutePreview } from '../../api/rides'
import { RouteMap } from '../ride-report/RouteMap'

const bikeIconMap: Record<string, React.ReactNode> = {
  gauge: <Gauge className="w-4 h-4" strokeWidth={1.5} />,
  mountain: <Mountain className="w-4 h-4" strokeWidth={1.5} />,
  trees: <Trees className="w-4 h-4" strokeWidth={1.5} />,
  'building-2': <Building2 className="w-4 h-4" strokeWidth={1.5} />,
}

function formatTimeHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

export function RidePlanner({
  initialValues,
  detectedLocation,
  locationSuggestions = [],
  bikeTypeOptions,
  intensityOptions,
  isLoading = false,
  formSource = null,
  onReset,
  onLocationSearch,
  onUseCurrentLocation,
  onLocationSelect,
  waypointLocationSuggestions = [],
  onWaypointLocationSearch,
  onDestinationSearch,
  destinationSuggestions = [],
  onGpxImport,
  onSubmit,
  onDirtyChange,
  children,
}: RidePlannerProps) {
  const today = new Date().toISOString().split('T')[0]
  const { t } = useTranslation()

  const [form, setForm] = useState<RideInput>({
    location: initialValues?.location ?? null,
    startDate: initialValues?.startDate ?? today,
    startTime: initialValues?.startTime ?? formatTimeHHMM(new Date()),
    bikeType: initialValues?.bikeType ?? 'gravel',
    intensity: initialValues?.intensity ?? 'moderat',
    distanceKm: initialValues?.distanceKm ?? null,
    elevationMeters: initialValues?.elevationMeters ?? null,
    durationMinutes: initialValues?.durationMinutes ?? null,
    averageSpeedKmh: initialValues?.averageSpeedKmh ?? null,
    gravelStyle: initialValues?.gravelStyle ?? ((initialValues?.bikeType ?? 'gravel') === 'gravel' ? 'road' : null),
    waypoints: initialValues?.waypoints ?? [],
    destination: initialValues?.destination ?? null,
    importedGeometry: initialValues?.importedGeometry,
  })

  const [durationManuallySet, setDurationManuallySet] = useState(!!initialValues?.durationMinutes)
  const [speedManuallySet, setSpeedManuallySet] = useState(!!initialValues?.averageSpeedKmh)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(
    initialValues?.importedGeometry && initialValues.distanceKm
      ? { geometry: initialValues.importedGeometry as [number, number][], distanceKm: initialValues.distanceKm, durationMinutes: 0 }
      : null
  )
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Track dirty state (form has been modified by user interaction)
  const hasInteracted = useRef(false)
  const [isDirty, setIsDirty] = useState(false)

  // Mark form as dirty on any user-initiated form change
  const markDirty = () => {
    if (!hasInteracted.current) {
      hasInteracted.current = true
      // Only consider dirty if location is set (minimal interaction threshold)
      if (form.location !== null) {
        setIsDirty(true)
      }
    }
  }

  // Update dirty state when location changes after interaction
  useEffect(() => {
    if (hasInteracted.current && form.location !== null) {
      setIsDirty(true)
    }
  }, [form.location])

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Route Preview Effect
  const waypointCoords = form.waypoints
    .filter(wp => wp.location.lat != null && wp.location.lon != null)
    .map(wp => [wp.location.lat!, wp.location.lon!] as [number, number])

  useEffect(() => {
    // Skip OSRM preview when imported geometry is already set
    if (form.importedGeometry) return
    if (form.location?.lat && form.location?.lon && form.destination?.lat && form.destination?.lon) {
      setIsPreviewLoading(true)
      fetchRoutePreview(
        form.location.lat, form.location.lon,
        form.destination.lat, form.destination.lon,
        waypointCoords
      )
        .then(preview => {
          setRoutePreview(preview)
          setForm(f => ({ ...f, distanceKm: preview.distanceKm }))
        })
        .catch(err => {
          console.error("Failed to fetch route preview", err)
          setRoutePreview(null)
        })
        .finally(() => setIsPreviewLoading(false))
    } else {
      setRoutePreview(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location?.lat, form.location?.lon, form.destination?.lat, form.destination?.lon, JSON.stringify(waypointCoords)])

  useEffect(() => {
    if (detectedLocation) setForm(f => ({ ...f, location: detectedLocation }))
  }, [detectedLocation])

  // Default speed for current bike type + intensity
  const defaultSpeed = (() => {
    const speedTable: Record<string, Record<string, number>> = {
      rennrad: { gemuetlich: 22, moderat: 27, sportlich: 32 },
      gravel: { gemuetlich: 18, moderat: 23, sportlich: 28 },
      'gravel-road': { gemuetlich: 20, moderat: 25, sportlich: 30 },
      mtb: { gemuetlich: 12, moderat: 16, sportlich: 20 },
      city: { gemuetlich: 14, moderat: 18, sportlich: 22 },
    }
    const key = form.bikeType === 'gravel' && form.gravelStyle === 'road' ? 'gravel-road' : form.bikeType
    return speedTable[key]?.[form.intensity] ?? 20
  })()

  // Auto-estimate duration from distance + speed (explicit or default)
  const autoEstimatedDuration = (() => {
    if (!form.distanceKm || form.distanceKm <= 0) return null
    const speed = form.averageSpeedKmh && form.averageSpeedKmh > 0 ? form.averageSpeedKmh : defaultSpeed
    const rawMinutes = (form.distanceKm / speed) * 60
    return Math.max(15, Math.ceil(rawMinutes / 15) * 15)
  })()

  // When distance/bike/intensity changes, update duration if not manually set
  useEffect(() => {
    if (!durationManuallySet && autoEstimatedDuration !== null) {
      setForm(f => ({ ...f, durationMinutes: autoEstimatedDuration }))
    }
  }, [autoEstimatedDuration, durationManuallySet])

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    markDirty()
    setForm(f => ({
      ...f,
      location: { address: suggestion.shortText, lat: suggestion.lat, lon: suggestion.lon },
    }))
    onLocationSelect?.(suggestion)
  }

  const handleSelectDestination = (suggestion: LocationSuggestion) => {
    markDirty()
    setForm(f => ({
      ...f,
      destination: { address: suggestion.shortText, lat: suggestion.lat, lon: suggestion.lon },
    }))
    // We don't have onDestinationSelect prop yet, but onDestinationSearch handles query.
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.location) errs.location = t('planner.validation.locationRequired')
    if (!form.destination) errs.destination = t('planner.validation.destinationRequired')
    if (!form.startDate) errs.startDate = t('planner.validation.dateRequired')
    if (!form.startTime) errs.startTime = t('planner.validation.timeRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const inputBase =
    'w-full rounded-xl text-sm bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-2.5'
  const inputError = 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30'
  const inputNormal = 'border-stone-200 dark:border-stone-700'

  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div className=" flex items-start justify-center py-10 px-4">
      {/* Ambient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(245,158,11,0.06) 0%, transparent 60%)',
        }}
      />
      <div className="fixed inset-0 -z-10 bg-stone-50 dark:bg-stone-950" />

      <div className="w-full max-w-[480px] space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1
            className="text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('planner.heading')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {t('planner.subheading')}
          </p>
          {onGpxImport && (
            <button
              type="button"
              onClick={onGpxImport}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <Import className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t('planner.gpxImport.button')}
            </button>
          )}
        </div>

        {/* Restored from session banner */}
        {formSource && !bannerDismissed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40">
            <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" strokeWidth={2} />
            <span className="flex-1 text-xs text-sky-700 dark:text-sky-400">
              {t(`planner.formSource.${formSource}`)}
            </span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" strokeWidth={2} />
                {t('planner.resetForm')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="text-sky-400 dark:text-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm"
        >
          <div className="p-6 space-y-5">

            {/* Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.startLocation')}
              </label>
              <LocationPicker
                value={form.location}
                suggestions={locationSuggestions}
                onSearch={onLocationSearch}
                onSelect={handleSelectSuggestion}
                onUseCurrentLocation={onUseCurrentLocation}
                onClear={() => setForm(f => ({ ...f, location: null }))}
                placeholder={t('planner.placeholder.cityOrAddress')}
                error={errors.location}
              />
            </div>

            {/* Waypoints (between start and destination) */}
            <div className="space-y-1.5">
              <WaypointList
                waypoints={form.waypoints}
                suggestions={waypointLocationSuggestions}
                onWaypointSearch={onWaypointLocationSearch}
                onChange={(waypoints: Waypoint[]) => setForm(f => ({ ...f, waypoints }))}
              />
            </div>

            {/* Destination Picker — always visible (required) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.destination')} *
              </label>
              <LocationPicker
                value={form.destination ?? null}
                suggestions={destinationSuggestions}
                onSearch={onDestinationSearch}
                onSelect={handleSelectDestination}
                onClear={() => {
                  setForm(f => ({ ...f, destination: null }))
                  setRoutePreview(null)
                }}
                placeholder={t('planner.placeholder.destination')}
                error={errors.destination}
                hideLocate
              />
            </div>

            {/* Route Preview Map */}
            {isPreviewLoading && (
              <div className="h-48 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center bg-stone-50 dark:bg-stone-800">
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              </div>
            )}
            {!isPreviewLoading && routePreview && form.location?.lat && form.location?.lon && form.destination?.lat && form.destination?.lon && (
              <div className="h-48 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm relative">
                <RouteMap
                  startLocation={{ lat: form.location.lat, lon: form.location.lon, label: 'Start' }}
                  destinationLocation={{ lat: form.destination.lat, lon: form.destination.lon, label: 'Dest' }}
                  routeGeometry={routePreview.geometry}
                  className="w-full h-full"
                />
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-2 py-1 rounded text-xs font-medium shadow-sm z-[1000] border border-stone-200 dark:border-stone-700">
                  {routePreview.distanceKm.toFixed(1)} km • {Math.round(routePreview.durationMinutes)} min
                </div>
              </div>
            )}

            {/* Date + Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.departure')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <input
                    type="date"
                    value={form.startDate}
                    min={today}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={`${inputBase} appearance-none pl-9 pr-3 ${errors.startDate ? inputError : inputNormal}`}
                  />
                </div>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className={`${inputBase} appearance-none pl-9 pr-3 ${errors.startTime ? inputError : inputNormal}`}
                  />
                </div>
              </div>
            </div>

            {/* Bike Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.bikeType')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bikeTypeOptions.map(option => {
                  const active = form.bikeType === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        markDirty()
                        const newBikeType = option.value as BikeType
                        setForm(f => ({
                          ...f,
                          bikeType: newBikeType,
                          gravelStyle: newBikeType === 'gravel' ? (f.gravelStyle ?? 'road') : null,
                        }))
                      }}
                      className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all ${active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-500'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                        }`}
                    >
                      <span
                        className={`transition-colors ${active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-400 dark:text-stone-500'
                          }`}
                      >
                        {bikeIconMap[option.icon] ?? <Route className="w-4 h-4" />}
                      </span>
                      <span
                        className={`text-xs font-semibold leading-tight ${active
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-600 dark:text-stone-400'
                          }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Gravel riding style sub-selection */}
              {form.bikeType === 'gravel' && (
                <div className="grid grid-cols-2 gap-2 mt-2 transition-all">
                  {(['road', 'offroad'] as GravelStyle[]).map(style => {
                    const active = form.gravelStyle === style
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, gravelStyle: style }))}
                        className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg border text-center transition-all ${active
                          ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-600'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                      >
                        <span className={`text-xs font-semibold ${active
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-600 dark:text-stone-400'
                          }`}>
                          {t(`planner.bikeType.gravelStyle${style === 'road' ? 'Road' : 'Offroad'}`)}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-snug">
                          {t(`planner.bikeType.gravelStyle${style === 'road' ? 'Road' : 'Offroad'}Desc`)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Riding Intensity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.intensity')}
              </label>
              <div className="grid grid-cols-3 gap-0 rounded-xl border-2 border-stone-200 dark:border-stone-700 overflow-hidden">
                {intensityOptions.map((option, i) => {
                  const active = form.intensity === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, intensity: option.value as RidingIntensity }))}
                      className={`relative flex flex-col items-center gap-0.5 py-3 px-2 text-center transition-all ${i < intensityOptions.length - 1 ? 'border-r-2 border-stone-200 dark:border-stone-700' : ''
                        } ${active
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750'
                        }`}
                    >
                      <span
                        className={`text-xs font-semibold ${active
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-600 dark:text-stone-400'
                          }`}
                      >
                        {option.label}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-snug hidden sm:block">
                        {option.description.split('—')[0].trim()}
                      </span>
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100 dark:border-stone-800" />

            {/* Advanced Options */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
                {t('planner.label.advancedOptions')}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  {/* Distance (optional — auto-filled from routing or GPX import) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('planner.label.distance')}
                    </label>
                    <div className="relative">
                      <Route
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                        strokeWidth={1.5}
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="999"
                        step="0.1"
                        value={form.distanceKm ?? ''}
                        onChange={e => {
                          markDirty()
                          setForm(f => ({ ...f, distanceKm: e.target.value ? Number(e.target.value) : null }))
                        }}
                        placeholder={t('planner.placeholder.egDistance')}
                        className={`${inputBase} pl-9 pr-12 ${inputNormal}`}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 dark:text-stone-500 pointer-events-none"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        km
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('planner.label.elevation')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        value={form.elevationMeters ?? ''}
                        onChange={e =>
                          setForm(f => ({ ...f, elevationMeters: e.target.value ? Number(e.target.value) : null }))
                        }
                        placeholder={t('planner.placeholder.egElevation')}
                        className={`${inputBase} pl-4 pr-10 ${inputNormal}`}
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 dark:text-stone-500 pointer-events-none"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        hm
                      </span>
                    </div>
                  </div>

                  {/* Average Speed */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('planner.label.averageSpeed')}
                    </label>
                    <div className="relative">
                      <Zap
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                        strokeWidth={1.5}
                      />
                      <input
                        type="number"
                        min="5"
                        max="60"
                        step="1"
                        value={form.averageSpeedKmh ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setSpeedManuallySet(val !== null)
                          setForm(f => ({ ...f, averageSpeedKmh: val }))
                        }}
                        placeholder={String(defaultSpeed)}
                        className={`${inputBase} pl-9 pr-16 ${inputNormal}`}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 dark:text-stone-500 pointer-events-none"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        km/h
                      </span>
                    </div>
                    {!speedManuallySet && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        {t('planner.speedEstimated')}
                      </p>
                    )}
                    {speedManuallySet && (
                      <button
                        type="button"
                        onClick={() => {
                          setSpeedManuallySet(false)
                          setForm(f => ({ ...f, averageSpeedKmh: null }))
                        }}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {t('planner.speedReset')}
                      </button>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('planner.label.duration')}
                    </label>
                    <div className="relative">
                      <Timer
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                        strokeWidth={1.5}
                      />
                      <input
                        type="number"
                        min="15"
                        max="1440"
                        step="15"
                        value={form.durationMinutes ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setDurationManuallySet(val !== null)
                          setForm(f => ({ ...f, durationMinutes: val }))
                        }}
                        placeholder={autoEstimatedDuration ? String(autoEstimatedDuration) : t('planner.placeholder.egDuration')}
                        className={`${inputBase} pl-9 pr-14 ${inputNormal}`}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 dark:text-stone-500 pointer-events-none"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        min
                      </span>
                    </div>
                    {autoEstimatedDuration && !durationManuallySet && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">
                        {t('planner.durationEstimated')}
                      </p>
                    )}
                    {durationManuallySet && (
                      <button
                        type="button"
                        onClick={() => {
                          setDurationManuallySet(false)
                          setForm(f => ({ ...f, durationMinutes: autoEstimatedDuration ?? null }))
                        }}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {t('planner.durationReset')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 pb-6 space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  {t('planner.button.fetchingWeather')}
                </>
              ) : (
                <>
                  {t('planner.button.getWeather')}
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Slot for recent rides or other content */}
        {children}

        {/* SEO description */}
        <section className="space-y-4 text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
          <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400">
            {t('planner.seo.heading')}
          </h2>
          <p>{t('planner.seo.intro')}</p>
          <dl className="space-y-3">
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.startLocationTitle')}</dt>
              <dd>{t('planner.seo.startLocationDesc')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.dateTimeTitle')}</dt>
              <dd>{t('planner.seo.dateTimeDesc')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.bikeTypeTitle')}</dt>
              <dd>{t('planner.seo.bikeTypeDesc')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.intensityTitle')}</dt>
              <dd>{t('planner.seo.intensityDesc')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.distanceTitle')}</dt>
              <dd>{t('planner.seo.distanceDesc')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-500 dark:text-stone-400">{t('planner.seo.multiDayTitle')}</dt>
              <dd>{t('planner.seo.multiDayDesc')}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
