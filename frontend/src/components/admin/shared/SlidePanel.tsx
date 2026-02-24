import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function SlidePanel({ open, onClose, title, size = 'md', children, footer }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-stone-900 shadow-xl flex flex-col animate-slide-in-right`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
