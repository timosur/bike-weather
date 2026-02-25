import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  RidePlannerProps,
  RideInput,
  BikeType,
  RidingIntensity,
  LocationSuggestion,
  QuickPreset,
  DayStop,
} from './types'
import { DayLocationList } from './DayLocationList'
import { LocationPicker } from './LocationPicker'

const bikeIconMap: Record<string, React.ReactNode> = {
  gauge: <Gauge className="w-4 h-4" strokeWidth={1.5} />,
  mountain: <Mountain className="w-4 h-4" strokeWidth={1.5} />,
  trees: <Trees className="w-4 h-4" strokeWidth={1.5} />,
  'building-2': <Building2 className="w-4 h-4" strokeWidth={1.5} />,
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatTimeHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

export function RidePlanner({
  initialValues,
  locationSuggestions = [],
  bikeTypeOptions,
  intensityOptions,
  quickPresets = [],
  isLoading = false,
  formSource = null,
  onReset,
  onLocationSearch,
  onUseCurrentLocation,
  onLocationSelect,
  onPresetSelect,
  dayStopLocationSuggestions = [],
  onDayStopLocationSearch,
  onSubmit,
  children,
}: RidePlannerProps) {
  const today = new Date().toISOString().split('T')[0]
  const { t, i18n } = useTranslation()

  const [form, setForm] = useState<RideInput>({
    location: initialValues?.location ?? null,
    startDate: initialValues?.startDate ?? today,
    startTime: initialValues?.startTime ?? formatTimeHHMM(new Date()),
    endDate: initialValues?.endDate ?? null,
    isMultiDay: initialValues?.isMultiDay ?? false,
    bikeType: initialValues?.bikeType ?? 'gravel',
    intensity: initialValues?.intensity ?? 'moderat',
    distanceKm: initialValues?.distanceKm ?? null,
    elevationMeters: initialValues?.elevationMeters ?? null,
    durationMinutes: initialValues?.durationMinutes ?? null,
    averageSpeedKmh: initialValues?.averageSpeedKmh ?? null,
    dayStops: initialValues?.dayStops ?? [],
  })

  const [durationManuallySet, setDurationManuallySet] = useState(!!initialValues?.durationMinutes)
  const [speedManuallySet, setSpeedManuallySet] = useState(!!initialValues?.averageSpeedKmh)

  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialValues?.distanceKm || initialValues?.elevationMeters || initialValues?.durationMinutes || initialValues?.averageSpeedKmh)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (form.isMultiDay && form.dayStops.length > 0 && form.startDate) {
      const calculatedEnd = addDays(form.startDate, form.dayStops.length)
      setForm(f => ({ ...f, endDate: calculatedEnd }))
    } else if (!form.isMultiDay) {
      setForm(f => ({ ...f, endDate: null }))
    }
  }, [form.isMultiDay, form.dayStops.length, form.startDate])

  // Default speed for current bike type + intensity
  const defaultSpeed = (() => {
    const speedTable: Record<string, Record<string, number>> = {
      rennrad: { gemuetlich: 22, moderat: 27, sportlich: 32 },
      gravel: { gemuetlich: 18, moderat: 23, sportlich: 28 },
      mtb: { gemuetlich: 12, moderat: 16, sportlich: 20 },
      city: { gemuetlich: 14, moderat: 18, sportlich: 22 },
    }
    return speedTable[form.bikeType]?.[form.intensity] ?? 20
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
    setForm(f => ({
      ...f,
      location: { address: suggestion.shortText, lat: suggestion.lat, lon: suggestion.lon },
    }))
    onLocationSelect?.(suggestion)
  }

  const handlePreset = (preset: QuickPreset) => {
    setForm(f => ({
      ...f,
      bikeType: preset.bikeType,
      intensity: preset.intensity,
      distanceKm: preset.distanceKm ?? null,
      isMultiDay: preset.isMultiDay,
      endDate: preset.isMultiDay ? f.endDate : null,
      dayStops: preset.isMultiDay ? f.dayStops : [],
    }))
    if (preset.distanceKm) setShowAdvanced(true)
    onPresetSelect?.(preset)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.location) errs.location = t('planner.validation.locationRequired')
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
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-10 px-4">
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
        <div className="text-center space-y-1">
          <h1
            className="text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('planner.heading')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {t('planner.subheading')}
          </p>
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

        {/* Quick presets */}
        {quickPresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickPresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:border-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-sm"
              >
                <Route className="w-3 h-3" strokeWidth={2.5} />
                {preset.label}
              </button>
            ))}
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

            {/* Date + Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('planner.label.departure')}
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                    className={`${inputBase} pl-9 pr-3 ${errors.startDate ? inputError : inputNormal}`}
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
                    className={`${inputBase} pl-9 pr-3 ${errors.startTime ? inputError : inputNormal}`}
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
                      onClick={() => setForm(f => ({ ...f, bikeType: option.value as BikeType }))}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                        {t('planner.label.distance')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={form.distanceKm ?? ''}
                          onChange={e =>
                            setForm(f => ({ ...f, distanceKm: e.target.value ? Number(e.target.value) : null }))
                          }
                          placeholder={t('planner.placeholder.egDistance')}
                          className={`${inputBase} pl-4 pr-12 ${inputNormal}`}
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

            {/* Divider */}
            <div className="border-t border-stone-100 dark:border-stone-800" />

            {/* Multi-day toggle */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    isMultiDay: !f.isMultiDay,
                    endDate: f.isMultiDay ? null : f.endDate,
                    dayStops: f.isMultiDay ? [] : f.dayStops,
                  }))
                }
                className="flex items-center gap-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                <div
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${form.isMultiDay ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                >
                  <div
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${form.isMultiDay ? 'left-[18px]' : 'left-[2px]'
                      }`}
                  />
                </div>
                {t('planner.label.multiDayTour')}
              </button>

              {form.isMultiDay && (
                <div className="space-y-3">
                  {form.endDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        {t('planner.label.endDate', { date: new Date(form.endDate).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('planner.label.overnightLocations')}
                    </label>
                    <DayLocationList
                      startLocation={form.location}
                      dayStops={form.dayStops}
                      suggestions={dayStopLocationSuggestions}
                      onStopSearch={onDayStopLocationSearch}
                      onChange={(dayStops: DayStop[]) => setForm(f => ({ ...f, dayStops }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 pb-6">
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
