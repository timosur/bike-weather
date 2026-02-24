import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MyRoutes } from '../components/my-routes'
import type { SavedRoute } from '../components/my-routes/types'
import { sampleRoutes } from '../data/sample-routes'

const STORAGE_KEY = 'bike-weather:saved-routes'

function loadRoutes(): SavedRoute[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Corrupted storage — fall through to seed data
  }
  // Seed with sample data on first visit
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRoutes))
  return sampleRoutes
}

function persistRoutes(routes: SavedRoute[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<SavedRoute[]>(loadRoutes)

  const handleRouteSelect = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId)
      if (!route) return

      // Update lastUsed timestamp
      const updated = routes.map((r) =>
        r.id === routeId ? { ...r, lastUsed: new Date().toISOString() } : r,
      )
      setRoutes(updated)
      persistRoutes(updated)

      // Navigate to report with route params as ride input
      navigate('/report', {
        state: {
          rideInput: {
            location: route.startLocation,
            distanceKm: route.totalDistance,
            ridingStyle: route.ridingStyle,
          },
        },
      })
    },
    [routes, navigate],
  )

  const handleRouteEdit = useCallback(
    (routeId: string, updates: Partial<Pick<SavedRoute, 'name' | 'startLocation' | 'totalDistance' | 'ridingStyle'>>) => {
      const updated = routes.map((r) =>
        r.id === routeId ? { ...r, ...updates } : r,
      )
      setRoutes(updated)
      persistRoutes(updated)
    },
    [routes],
  )

  const handleRouteDelete = useCallback(
    (routeId: string) => {
      const updated = routes.filter((r) => r.id !== routeId)
      setRoutes(updated)
      persistRoutes(updated)
    },
    [routes],
  )

  const handleNavigateToPlanner = useCallback(() => {
    navigate('/planner')
  }, [navigate])

  return (
    <MyRoutes
      routes={routes}
      onRouteSelect={handleRouteSelect}
      onRouteEdit={handleRouteEdit}
      onRouteDelete={handleRouteDelete}
      onNavigateToPlanner={handleNavigateToPlanner}
    />
  )
}
