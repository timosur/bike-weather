import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

const iconMap = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg animate-fade-in"
        >
          {iconMap[toast.type]}
          <p className="text-sm text-stone-700 dark:text-stone-300 flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
