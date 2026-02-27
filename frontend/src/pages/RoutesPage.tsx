import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MyRoutes } from '../components/my-routes'
import { SEO } from '../hooks/useSEO'
import type { SavedRoute } from '../components/my-routes/types'
import { fetchRoutes, updateRoute as apiUpdateRoute, deleteRoute as apiDeleteRoute } from '../api/routes'
import { shareRoute, unshareRoute, getShareUrl } from '../api/shared'
import { useToast } from '../hooks/useToast'

export default function RoutesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addToast } = useToast()
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
      navigate(`/report/${routeId}`)
    },
    [navigate],
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

  const handleRouteShare = useCallback(
    (routeId: string) => {
      shareRoute(routeId)
        .then(({ share_token }) => {
          const url = getShareUrl(share_token)
          // Update local state so badge shows immediately
          setRoutes((prev) =>
            prev.map((r) =>
              r.id === routeId ? { ...r, shareToken: share_token } : r
            )
          )
          navigator.clipboard.writeText(url)
          addToast(t('report.linkCopied'), 'success')
        })
        .catch(() => addToast(t('report.shareError'), 'error'))
    },
    [addToast, t],
  )

  const handleRouteUnshare = useCallback(
    (routeId: string) => {
      unshareRoute(routeId)
        .then(() => {
          setRoutes((prev) =>
            prev.map((r) =>
              r.id === routeId ? { ...r, shareToken: null } : r
            )
          )
          addToast(t('routes.unshared'), 'success')
        })
        .catch(() => {/* ignore */ })
    },
    [addToast, t],
  )

  const handleNavigateToPlanner = useCallback(() => {
    navigate('/planner')
  }, [navigate])

  const handleCopyShareLink = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId)
      if (!route?.shareToken) return
      const url = getShareUrl(route.shareToken)
      navigator.clipboard.writeText(url)
      addToast(t('report.linkCopied'), 'success')
    },
    [routes, addToast, t],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <>
      <SEO titleKey="routes" path="/routes" noIndex />
      <MyRoutes
        routes={routes}
        onRouteSelect={handleRouteSelect}
        onRouteEdit={handleRouteEdit}
        onRouteDelete={handleRouteDelete}
        onRouteShare={handleRouteShare}
        onRouteUnshare={handleRouteUnshare}
        onCopyShareLink={handleCopyShareLink}
        onNavigateToPlanner={handleNavigateToPlanner}
      />
    </>
  )
}
