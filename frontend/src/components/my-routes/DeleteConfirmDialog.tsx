import { AlertTriangle } from 'lucide-react'
import type { SavedRoute } from './types'

interface DeleteConfirmDialogProps {
  route: SavedRoute
  onConfirm?: () => void
  onCancel?: () => void
}

export function DeleteConfirmDialog({ route, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 shadow-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" strokeWidth={1.5} />
        </div>

        <h3
          className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Really delete route?
        </h3>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          <span className="font-medium text-stone-700 dark:text-stone-300">{route.name}</span> will be
          permanently deleted and cannot be recovered.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
