import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RidePlanner } from '../components/ride-planner'
import { useLocationSearch } from '../hooks/useLocationSearch'
import type { BikeTypeOption, RidingIntensityOption, QuickPreset, RideInput } from '../components/ride-planner/types'

const bikeTypeOptions: BikeTypeOption[] = [
  { value: 'rennrad', label: 'Road bike', description: 'Fast on tarmac — light clothing, aerodynamic.', icon: 'gauge' },
  { value: 'gravel', label: 'Gravel', description: 'Mix of road and gravel — versatile riding.', icon: 'mountain' },
  { value: 'mtb', label: 'MTB', description: 'Off-road on trails — rugged gear required.', icon: 'trees' },
  { value: 'city', label: 'City', description: 'Urban traffic and short distances — everyday practical.', icon: 'building-2' },
]

const intensityOptions: RidingIntensityOption[] = [
  { value: 'gemuetlich', label: 'Relaxed', description: 'Relaxed pace, minimal sweating — pleasure ride.' },
  { value: 'moderat', label: 'Moderate', description: 'Medium pace, light sweating — active tour.' },
  { value: 'sportlich', label: 'Sporty', description: 'High pace, heavy sweating — training ride.' },
]

const quickPresets: QuickPreset[] = [
  { id: 'p1', label: 'Commute', description: 'Short daily ride to work', bikeType: 'city', intensity: 'gemuetlich', distanceKm: 12, isMultiDay: false },
  { id: 'p2', label: 'Weekend tour', description: 'Relaxed loop through the countryside', bikeType: 'gravel', intensity: 'moderat', distanceKm: 50, isMultiDay: false },
  { id: 'p3', label: 'Road bike ride', description: 'Sporty ride at high pace', bikeType: 'rennrad', intensity: 'sportlich', distanceKm: 80, isMultiDay: false },
  { id: 'p4', label: 'Multi-day trip', description: 'Bike tour over several days', bikeType: 'gravel', intensity: 'gemuetlich', isMultiDay: true },
]

export default function PlannerPage() {
  const navigate = useNavigate()
  const {
    suggestions,
    dayStopSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchDayStopLocation,
    useCurrentLocation,
  } = useLocationSearch()

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
