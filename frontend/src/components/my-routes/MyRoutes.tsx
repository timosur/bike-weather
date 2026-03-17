import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MyRoutesProps, SavedRoute } from './types'
import { RouteCard } from './RouteCard'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { EmptyRoutes } from './EmptyRoutes'

export function MyRoutes({ routes, onRouteSelect, onRouteReplan, onRouteDelete, onRouteShare, onRouteUnshare, onCopyShareLink, onNavigateToPlanner }: MyRoutesProps) {
  const { t } = useTranslation()
  const [deletingRoute, setDeletingRoute] = useState<SavedRoute | null>(null)

  if (routes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyRoutes onNavigateToPlanner={onNavigateToPlanner} />
      </div>
    )
  }

  // Sort by lastUsed descending (never-used routes sort to the end)
  const sorted = [...routes].sort((a, b) => {
    if (!a.lastUsed && !b.lastUsed) return 0
    if (!a.lastUsed) return 1
    if (!b.lastUsed) return -1
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
  })

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('routes.heading')}
        </h1>
        <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
          {routes.length}
        </span>
      </div>

      {/* Route grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            onSelect={() => onRouteSelect?.(route.id)}
            onReplan={() => onRouteReplan?.(route.id)}
            onDelete={() => setDeletingRoute(route)}
            onShare={() => onRouteShare?.(route.id)}
            onUnshare={() => onRouteUnshare?.(route.id)}
            onCopyShareLink={() => onCopyShareLink?.(route.id)}
          />
        ))}
      </div>

      {/* Delete confirmation */}
      {deletingRoute && (
        <DeleteConfirmDialog
          route={deletingRoute}
          onConfirm={() => {
            onRouteDelete?.(deletingRoute.id)
            setDeletingRoute(null)
          }}
          onCancel={() => setDeletingRoute(null)}
        />
      )}
    </div>
  )
}
