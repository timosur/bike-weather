import { useCallback, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { AppShell } from './components/shell'
import type { NavigationItem, FooterSection } from './components/shell'
import { RidePlannerSkeleton } from './components/ride-planner'
import { RideReportSkeleton } from './components/ride-report'
import { ProductCategoriesSkeleton, ProductCategoryDetailSkeleton } from './components/product-recommendations'
import { MyRoutesSkeleton } from './components/my-routes'
import { AuthPageSkeleton } from './components/auth'
import { ContentPageSkeleton } from './components/skeleton'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { setAccessTokenProvider } from './api/client'

const PlannerPage = lazy(() => import('./pages/PlannerPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductCategoryPage = lazy(() => import('./pages/ProductCategoryPage'))
const RoutesPage = lazy(() => import('./pages/RoutesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AboutMePage = lazy(() => import('./pages/AboutMePage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ImprintPage = lazy(() => import('./pages/ImprintPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))

const navigationItems: NavigationItem[] = [
  { label: 'Planner', href: '/planner' },
  { label: 'Ride Report', href: '/report' },
  { label: 'Products', href: '/products' },
  { label: 'My Routes', href: '/routes', requiresAuth: true },
  { label: 'About Me', href: '/about-me' },
]

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Ride Planner', href: '/planner' },
      { label: 'FAQ', href: '/faq' },
      { label: 'About Me', href: '/about-me' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'Give Feedback', href: '/contact' },
      { label: 'Sign In', href: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Imprint', href: '/imprint' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  },
]

/** Redirects to /login if user is not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, getAccessToken } = useAuth()

  useEffect(() => {
    setAccessTokenProvider(getAccessToken)
  }, [getAccessToken])

  const handleNavigate = useCallback(
    (href: string) => navigate(href),
    [navigate],
  )

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const appUser = isAuthenticated && user
    ? { name: user.name || user.email || 'User' }
    : undefined

  const itemsWithActive = navigationItems.map(item => ({
    ...item,
    isActive: location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
  }))

  return (
    <AppShell
      navigationItems={itemsWithActive}
      footerSections={footerSections}
      user={appUser}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/planner" element={<Suspense fallback={<RidePlannerSkeleton />}><PlannerPage /></Suspense>} />
        <Route path="/report" element={<Suspense fallback={<RideReportSkeleton />}><ReportPage /></Suspense>} />
        <Route path="/products" element={<Suspense fallback={<ProductCategoriesSkeleton />}><ProductsPage /></Suspense>} />
        <Route path="/products/:categoryId" element={<Suspense fallback={<ProductCategoryDetailSkeleton />}><ProductCategoryPage /></Suspense>} />
        <Route path="/routes" element={<Suspense fallback={<MyRoutesSkeleton />}><RequireAuth><RoutesPage /></RequireAuth></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<AuthPageSkeleton />}><LoginPage /></Suspense>} />
        <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
        <Route path="/about-me" element={<Suspense fallback={<ContentPageSkeleton sections={3} />}><AboutMePage /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<ContentPageSkeleton sections={5} />}><FaqPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<ContentPageSkeleton sections={4} maxWidth="max-w-[480px]" />}><ContactPage /></Suspense>} />
        <Route path="/imprint" element={<Suspense fallback={<ContentPageSkeleton sections={4} />}><ImprintPage /></Suspense>} />
        <Route path="/privacy-policy" element={<Suspense fallback={<ContentPageSkeleton sections={7} />}><PrivacyPolicyPage /></Suspense>} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
