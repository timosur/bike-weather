import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { SavedRoute, RidingStyle } from './types'

const ridingStyles: RidingStyle[] = ['Sporty', 'Easy', 'Touring']

interface EditRouteModalProps {
  route: SavedRoute
  onSave?: (routeId: string, updates: Partial<Pick<SavedRoute, 'name' | 'startLocation' | 'totalDistance' | 'ridingStyle'>>) => void
  onClose?: () => void
}

export function EditRouteModal({ route, onSave, onClose }: EditRouteModalProps) {
  const [name, setName] = useState(route.name)
  const [startLocation, setStartLocation] = useState(route.startLocation)
  const [totalDistance, setTotalDistance] = useState(route.totalDistance)
  const [ridingStyle, setRidingStyle] = useState<RidingStyle>(route.ridingStyle)
  const { t } = useTranslation()

  const ridingStyleLabels: Record<RidingStyle, string> = {
    'Sporty': t('routes.edit.ridingStyleSporty'),
    'Easy': t('routes.edit.ridingStyleEasy'),
    'Touring': t('routes.edit.ridingStyleTouring'),
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave?.(route.id, { name, startLocation, totalDistance, ridingStyle })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2
            className="text-lg font-semibold text-stone-900 dark:text-stone-100"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('routes.edit.heading')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('routes.edit.routeName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200 dark:ring-stone-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('routes.edit.startLocation')}
            </label>
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200 dark:ring-stone-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('routes.edit.distance', { unit: route.distanceUnit })}
            </label>
            <input
              type="number"
              min={1}
              value={totalDistance}
              onChange={(e) => setTotalDistance(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200 dark:ring-stone-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('routes.edit.ridingStyle')}
            </label>
            <div className="flex gap-2">
              {ridingStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setRidingStyle(style)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ridingStyle === style
                      ? 'bg-emerald-600 text-white dark:bg-emerald-600'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {ridingStyleLabels[style]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
