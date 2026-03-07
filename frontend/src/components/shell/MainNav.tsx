import type { NavigationItem } from './AppShell'

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  className?: string
}

export function MainNav({ items, onNavigate, className = '' }: MainNavProps) {
  return (
    <nav className={`flex items-center gap-0.5 ${className}`} role="navigation">
      {items.map(item => (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => { e.preventDefault(); onNavigate?.(item.href) }}
          className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${item.isActive
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
        >
          {item.label}
          {item.isActive && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          )}
        </a>
      ))}
    </nav>
  )
}
