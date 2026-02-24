import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Shield } from 'lucide-react'

interface UserMenuProps {
  user: { name: string; avatarUrl?: string }
  isAdmin?: boolean
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

export function UserMenu({ user, isAdmin, onNavigate, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="text-sm text-stone-700 dark:text-stone-300 font-medium max-w-24 truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">Signed in as</p>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{user.name}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate?.('/admin')
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              Admin
            </button>
          )}
          <button
            onClick={() => {
              onLogout?.()
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
