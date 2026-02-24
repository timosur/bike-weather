import { useState, useRef, useEffect } from 'react'
import { MapPin, Route, Gauge, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { SavedRoute, ConditionRating } from './types'

const conditionConfig: Record<ConditionRating, { label: string; bg: string; text: string; dot: string }> = {
  ideal: {
    label: 'Ideal',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  good: {
    label: 'Good',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  caution: {
    label: 'Caution',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  'not-recommended': {
    label: 'Not recommended',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface RouteCardProps {
  route: SavedRoute
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function RouteCard({ route, onSelect, onEdit, onDelete }: RouteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      className="group relative rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 hover:ring-emerald-300 dark:hover:ring-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onSelect?.()}
    >
      {/* Top accent bar */}
      <div className="h-1 rounded-t-xl bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="p-4">
        {/* Header row: name + menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3
            className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {route.name}
          </h3>

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              aria-label="Actions"
            >
              <MoreVertical className="w-4 h-4" strokeWidth={2} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 shadow-lg py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit?.()
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete?.()
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Route details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{route.startLocation}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5" strokeWidth={1.5} />
              {route.totalDistance} {route.distanceUnit}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" strokeWidth={1.5} />
              {route.ridingStyle}
            </span>
          </div>
        </div>

        {/* Footer: condition badge + last used */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
          {route.lastCondition ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionConfig[route.lastCondition].bg} ${conditionConfig[route.lastCondition].text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${conditionConfig[route.lastCondition].dot}`} />
              {conditionConfig[route.lastCondition].label}
            </span>
          ) : (
            <span className="text-xs text-stone-400 dark:text-stone-500 italic">
              Not yet checked
            </span>
          )}

          {route.lastUsed && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {formatRelativeDate(route.lastUsed)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
