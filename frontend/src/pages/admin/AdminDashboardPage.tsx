import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Grid3X3, Store, HelpCircle, FileText, MessageSquare, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { fetchAdminProducts, fetchAdminCategories, fetchAdminShops, fetchProductOverview } from '@/api/admin/products'
import { fetchAdminFaq } from '@/api/admin/faq'
import { fetchAdminAbout } from '@/api/admin/about'
import { fetchAdminContacts } from '@/api/admin/contacts'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import type { CategoryOverviewItem } from '@/components/admin/types'

interface StatCard {
  label: string
  count: number | null
  icon: React.ReactNode
  href: string
  color: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [overview, setOverview] = useState<CategoryOverviewItem[] | null>(null)
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

    async function loadOverview() {
      try {
        const data = await fetchProductOverview()
        setOverview(data)
      } catch {
        setOverview([])
      }
    }

    loadStats()
    loadOverview()
  }, [])

  const statusIcon = (status: CategoryOverviewItem['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'outdated':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'empty':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const statusVariant = (status: CategoryOverviewItem['status']): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'ok': return 'success'
      case 'outdated': return 'warning'
      case 'empty': return 'danger'
    }
  }

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

      {/* Product Overview by Category */}
      <h2
        className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-10 mb-4"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {t('admin.overview.title')}
      </h2>

      {overview === null ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : overview.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('admin.overview.noCategories')}</p>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.category')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.status')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.total')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.published')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.draft')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('admin.overview.lastUpdated')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {(() => {
                const grouped = new Map<string, CategoryOverviewItem[]>()
                for (const item of overview) {
                  const zone = item.zone
                  if (!grouped.has(zone)) grouped.set(zone, [])
                  grouped.get(zone)!.push(item)
                }
                return Array.from(grouped.entries()).map(([zone, items]) => (
                  <Fragment key={zone}>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-2 bg-stone-50 dark:bg-stone-800/70 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                      >
                        {t(`admin.overview.zone.${zone}`)}
                      </td>
                    </tr>
                    {items.map((item) => (
                      <tr key={item.categoryId} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {statusIcon(item.status)}
                            <span className="font-medium text-stone-900 dark:text-stone-100">{item.categoryName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={statusVariant(item.status)}>
                            {t(`admin.overview.statusLabel.${item.status}`)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right text-stone-900 dark:text-stone-100 tabular-nums">{item.totalProducts}</td>
                        <td className="px-4 py-3 text-right text-stone-900 dark:text-stone-100 tabular-nums">{item.publishedProducts}</td>
                        <td className="px-4 py-3 text-right text-stone-900 dark:text-stone-100 tabular-nums">{item.unpublishedProducts}</td>
                        <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{formatDate(item.newestProductAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/admin/products?category=${item.categoryId}`)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {t('admin.overview.viewProducts')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
