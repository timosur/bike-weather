import { useState, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { ToastContainer } from '@/components/common/ToastContainer'
import { ToastProvider } from '@/hooks/useToast'

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()

  const handleNavigate = useCallback(
    (href: string) => navigate(href),
    [navigate],
  )

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNavigate={handleNavigate}
          />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <ToastContainer />
      </div>
    </ToastProvider>
  )
}
