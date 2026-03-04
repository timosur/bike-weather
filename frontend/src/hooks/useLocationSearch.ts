import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { LocationSuggestion, RideLocation } from '../components/ride-planner/types'
import { searchLocations, reverseGeocode } from '../api/geocoding'

export function useLocationSearch() {
  const { t } = useTranslation()
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [waypointSuggestions, setWaypointSuggestions] = useState<LocationSuggestion[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<RideLocation | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const waypointDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const destinationDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const searchLocation = useCallback((query: string) => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(query)
        setSuggestions(data)
      } catch {
        setSuggestions([])
      }
    }, 300)
  }, [])

  const searchWaypointLocation = useCallback((_waypointIndex: number, query: string) => {
    clearTimeout(waypointDebounceRef.current)
    if (query.length < 2) {
      setWaypointSuggestions([])
      return
    }
    waypointDebounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(query)
        setWaypointSuggestions(data)
      } catch {
        setWaypointSuggestions([])
      }
    }, 300)
  }, [])

  const searchDestination = useCallback((query: string) => {
    clearTimeout(destinationDebounceRef.current)
    if (query.length < 2) {
      setDestinationSuggestions([])
      return
    }
    destinationDebounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(query)
        setDestinationSuggestions(data)
      } catch {
        setDestinationSuggestions([])
      }
    }, 300)
  }, [])

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const result = await reverseGeocode(latitude, longitude)
          if (result) {
            setDetectedLocation({ address: result.shortText, lat: latitude, lon: longitude })
          } else {
            setDetectedLocation({ address: t('location.currentLocation'), lat: latitude, lon: longitude })
          }
        } catch {
          setDetectedLocation({ address: t('location.currentLocation'), lat: latitude, lon: longitude })
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [t])

  const clearDetectedLocation = useCallback(() => {
    setDetectedLocation(null)
  }, [])

  return {
    suggestions,
    waypointSuggestions,
    destinationSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchWaypointLocation,
    searchDestination,
    useCurrentLocation,
    clearDetectedLocation,
    clearSuggestions: () => setSuggestions([]),
  }
}
