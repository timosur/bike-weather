import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MyRoutes } from '../components/my-routes'
import type { SavedRoute } from '../components/my-routes/types'
import { fetchRoutes, updateRoute as apiUpdateRoute, deleteRoute as apiDeleteRoute } from '../api/routes'

export default function RoutesPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false))
  }, [])

  const handleRouteSelect = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId)
      if (!route) return

      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const now = new Date()
      const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      // Navigate to report with route params as ride input
      navigate('/report', {
        state: {
          routeId: route.id,
          rideInput: {
            location: { address: route.startLocation },
            startDate: today,
            startTime,
            endDate: null,
            isMultiDay: false,
            bikeType: 'rennrad',
            intensity: route.ridingStyle === 'Sporty' ? 'sportlich' : route.ridingStyle === 'Easy' ? 'gemuetlich' : 'moderat',
            distanceKm: route.totalDistance,
            dayStops: [],
          },
        },
      })
    },
    [routes, navigate],
  )

  const handleRouteEdit = useCallback(
    (routeId: string, updates: Partial<Pick<SavedRoute, 'name' | 'startLocation' | 'totalDistance' | 'ridingStyle'>>) => {
      // Map camelCase frontend keys to snake_case API keys
      const apiUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) apiUpdates.start_location = updates.name
      if (updates.startLocation !== undefined) apiUpdates.start_location = updates.startLocation
      if (updates.totalDistance !== undefined) apiUpdates.total_distance = updates.totalDistance
      if (updates.ridingStyle !== undefined) apiUpdates.riding_style = updates.ridingStyle
      if (updates.name !== undefined) apiUpdates.name = updates.name

      apiUpdateRoute(routeId, apiUpdates)
        .then(() => fetchRoutes().then(setRoutes))
        .catch(() => {/* ignore */ })
    },
    [],
  )

  const handleRouteDelete = useCallback(
    (routeId: string) => {
      apiDeleteRoute(routeId)
        .then(() => setRoutes((prev) => prev.filter((r) => r.id !== routeId)))
        .catch(() => {/* ignore */ })
    },
    [],
  )

  const handleNavigateToPlanner = useCallback(() => {
    navigate('/planner')
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

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
