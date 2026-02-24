import { useState, useRef, useCallback } from 'react'
import type { LocationSuggestion, RideLocation } from '../components/ride-planner/types'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

function toSuggestion(r: NominatimResult): LocationSuggestion {
  const parts = r.display_name.split(',')
  const shortText = parts.slice(0, 2).map(s => s.trim()).join(', ')
  return {
    id: String(r.place_id),
    displayText: r.display_name,
    shortText,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  }
}

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [dayStopSuggestions, setDayStopSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<RideLocation | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dayStopDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const searchLocation = useCallback((query: string) => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        })
        const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
          headers: { 'Accept-Language': 'en' },
        })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data.map(toSuggestion))
      } catch {
        setSuggestions([])
      }
    }, 300)
  }, [])

  const searchDayStopLocation = useCallback((_stopIndex: number, query: string) => {
    clearTimeout(dayStopDebounceRef.current)
    if (query.length < 2) {
      setDayStopSuggestions([])
      return
    }
    dayStopDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        })
        const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
          headers: { 'Accept-Language': 'en' },
        })
        const data: NominatimResult[] = await res.json()
        setDayStopSuggestions(data.map(toSuggestion))
      } catch {
        setDayStopSuggestions([])
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
          const params = new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: 'json',
            addressdetails: '1',
          })
          const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
            headers: { 'Accept-Language': 'en' },
          })
          const data: NominatimResult = await res.json()
          const parts = data.display_name.split(',')
          const address = parts.slice(0, 2).map(s => s.trim()).join(', ')
          setDetectedLocation({ address, lat: latitude, lon: longitude })
        } catch {
          setDetectedLocation({ address: 'Current location', lat: latitude, lon: longitude })
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const clearDetectedLocation = useCallback(() => {
    setDetectedLocation(null)
  }, [])

  return {
    suggestions,
    dayStopSuggestions,
    isLocating,
    detectedLocation,
    searchLocation,
    searchDayStopLocation,
    useCurrentLocation,
    clearDetectedLocation,
    clearSuggestions: () => setSuggestions([]),
  }
}
