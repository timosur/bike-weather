import { useLocation } from 'react-router-dom'
import { Menu, ArrowLeft, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  onNavigate: (href: string) => void
}

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/shops': 'Shops',
  '/admin/faq': 'FAQ',
  '/admin/about': 'About',
  '/admin/contacts': 'Messages',
}

export function AdminHeader({ onToggleSidebar, onNavigate }: AdminHeaderProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const currentPage = breadcrumbMap[location.pathname] ?? 'Admin'

  return (
    <header className="h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center px-4 gap-3 shrink-0">
      {/* Mobile sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-stone-400 dark:text-stone-500">Admin</span>
        <span className="text-stone-300 dark:text-stone-600">/</span>
        <span className="font-medium text-stone-900 dark:text-stone-100">{currentPage}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => onNavigate('/planner')}
          className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to site
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
