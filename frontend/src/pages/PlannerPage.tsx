import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RidePlanner } from '../components/ride-planner'
import { useLocationSearch } from '../hooks/useLocationSearch'
import type { BikeTypeOption, RidingIntensityOption, QuickPreset, RideInput } from '../components/ride-planner/types'

export default function PlannerPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    suggestions,
    dayStopSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchDayStopLocation,
    useCurrentLocation,
  } = useLocationSearch()

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

  const handleSubmit = (input: RideInput) => {
    navigate('/report', { state: { rideInput: input } })
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
    <RidePlanner
      key={detectKeyRef.current}
      initialValues={detectedLocation ? { location: detectedLocation } : undefined}
      locationSuggestions={suggestions}
      dayStopLocationSuggestions={dayStopSuggestions}
      bikeTypeOptions={bikeTypeOptions}
      intensityOptions={intensityOptions}
      quickPresets={quickPresets}
      isLoading={isLocating}
      onLocationSearch={searchLocation}
      onUseCurrentLocation={useCurrentLocation}
      onLocationSelect={() => {}}
      onDayStopLocationSearch={searchDayStopLocation}
      onPresetSelect={() => {}}
      onSubmit={handleSubmit}
    />
  )
}
