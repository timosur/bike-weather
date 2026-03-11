import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface ProductBreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate: (href: string) => void
}

export function ProductBreadcrumb({ items, onNavigate }: ProductBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          {item.href ? (
            <button
              onClick={() => onNavigate(item.href!)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-stone-900 dark:text-stone-100 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
