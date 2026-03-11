import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  Store,
  HelpCircle,
  FileText,
  MessageSquare,
  Download,
  ChevronLeft,
  Bike,
} from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  { label: 'Categories', href: '/admin/categories', icon: <Grid3X3 className="w-5 h-5" /> },
  { label: 'Shops', href: '/admin/shops', icon: <Store className="w-5 h-5" /> },
  { label: 'FAQ', href: '/admin/faq', icon: <HelpCircle className="w-5 h-5" /> },
  { label: 'About', href: '/admin/about', icon: <FileText className="w-5 h-5" /> },
  { label: 'Messages', href: '/admin/contacts', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Product Import', href: '/admin/import', icon: <Download className="w-5 h-5" /> },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate: (href: string) => void
}

export function AdminSidebar({ collapsed, onToggle, onNavigate }: AdminSidebarProps) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'
        } hidden md:flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-200 shrink-0`}
    >
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b border-stone-200 dark:border-stone-800 gap-2">
        <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
          <Bike className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <span
            className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Admin
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-stone-200 dark:border-stone-800 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            strokeWidth={1.5}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
