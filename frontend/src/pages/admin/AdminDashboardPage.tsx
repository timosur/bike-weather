import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Grid3X3, Store, HelpCircle, FileText, MessageSquare } from 'lucide-react'
import { fetchAdminProducts, fetchAdminCategories, fetchAdminShops } from '@/api/admin/products'
import { fetchAdminFaq } from '@/api/admin/faq'
import { fetchAdminAbout } from '@/api/admin/about'
import { fetchAdminContacts } from '@/api/admin/contacts'

interface StatCard {
  label: string
  count: number | null
  icon: React.ReactNode
  href: string
  color: string
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatCard[]>([
    { label: 'Products', count: null, icon: <Package className="w-6 h-6" />, href: '/admin/products', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Categories', count: null, icon: <Grid3X3 className="w-6 h-6" />, href: '/admin/categories', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Shops', count: null, icon: <Store className="w-6 h-6" />, href: '/admin/shops', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'FAQ Items', count: null, icon: <HelpCircle className="w-6 h-6" />, href: '/admin/faq', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'About Sections', count: null, icon: <FileText className="w-6 h-6" />, href: '/admin/about', color: 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800' },
    { label: 'Messages', count: null, icon: <MessageSquare className="w-6 h-6" />, href: '/admin/contacts', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' },
  ])

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, categories, shops, faq, about, contacts] = await Promise.allSettled([
          fetchAdminProducts(1, 1),
          fetchAdminCategories(),
          fetchAdminShops(),
          fetchAdminFaq(),
          fetchAdminAbout(),
          fetchAdminContacts(1, 1),
        ])

        setStats((prev) =>
          prev.map((s, i) => {
            const results = [products, categories, shops, faq, about, contacts]
            const result = results[i]
            if (result.status === 'fulfilled') {
              const val = result.value
              return { ...s, count: Array.isArray(val) ? val.length : val.total }
            }
            return { ...s, count: 0 }
          }),
        )
      } catch {
        // Counts will remain null
      }
    }
    loadStats()
  }, [])

  return (
    <div>
      <h1
        className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.href)}
            className="flex items-center gap-4 p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-stone-300 dark:hover:border-stone-700 transition-colors text-left group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</p>
              {stat.count !== null ? (
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stat.count}</p>
              ) : (
                <div className="h-8 w-12 bg-stone-200 dark:bg-stone-700 rounded animate-pulse mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
