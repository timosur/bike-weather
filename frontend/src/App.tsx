import { useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { FaroErrorBoundary, FaroRoutes } from '@grafana/faro-react'
import { useTranslation } from 'react-i18next'
import { AppShell } from './components/shell'
import type { NavigationItem, FooterSection } from './components/shell'
import { RidePlannerSkeleton } from './components/ride-planner'
// import { ProductCategoriesSkeleton, ProductCategoryDetailSkeleton } from './components/product-recommendations'
import { MyRoutesSkeleton } from './components/my-routes'
import { AuthPageSkeleton } from './components/auth'
import { ContentPageSkeleton } from './components/skeleton'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './hooks/useToast'
import { ToastContainer } from './components/common/ToastContainer'
import { setAccessTokenProvider } from './api/client'

const PlannerPage = lazy(() => import('./pages/PlannerPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
// const ProductsPage = lazy(() => import('./pages/ProductsPage'))
// const ProductCategoryPage = lazy(() => import('./pages/ProductCategoryPage'))
const RoutesPage = lazy(() => import('./pages/RoutesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const AboutMePage = lazy(() => import('./pages/AboutMePage'))
const AboutAppPage = lazy(() => import('./pages/AboutAppPage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ImprintPage = lazy(() => import('./pages/ImprintPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))

// Admin pages
const AdminLayout = lazy(() => import('./components/admin/layout/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))
const AdminShopsPage = lazy(() => import('./pages/admin/AdminShopsPage'))
const AdminFaqPage = lazy(() => import('./pages/admin/AdminFaqPage'))
const AdminAboutPage = lazy(() => import('./pages/admin/AdminAboutPage'))
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'))
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'))

function useNavigationItems(): NavigationItem[] {
  const { t } = useTranslation()
  return [
    { label: t('shell.nav.planner'), href: '/planner' },
    // { label: t('shell.nav.products'), href: '/products' },
    { label: t('shell.nav.myRoutes'), href: '/routes', requiresAuth: true },
    { label: t('shell.nav.aboutApp'), href: '/about' },
  ]
}

function useFooterSections(): FooterSection[] {
  const { t } = useTranslation()
  return [
    {
      title: t('shell.footerSection.product'),
      links: [
        { label: t('shell.footerLinks.faq'), href: '/faq' },
        { label: t('shell.footerLinks.aboutMe'), href: '/about-me' },
      ],
    },
    {
      title: t('shell.footerSection.contact'),
      links: [
        { label: t('shell.footerLinks.giveFeedback'), href: '/contact' },
      ],
    },
  ]
}

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

/** Redirects to /planner if user is not an admin */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (!isAdmin) {
    return <Navigate to="/planner" replace />
  }
  return <>{children}</>
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, user, logout, getAccessToken } = useAuth()
  const { i18n } = useTranslation()
  const navigationItems = useNavigationItems()
  const footerSections = useFooterSections()

  // Track a reset key for forcing planner remount when clicking nav while already on planner
  const plannerResetKeyRef = useRef(0)

  useEffect(() => {
    setAccessTokenProvider(getAccessToken)
  }, [getAccessToken])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleNavigate = useCallback(
    (href: string) => {
      // If clicking "Routenplaner" while already on /planner or /report, force reset
      if (href === '/planner' && (location.pathname === '/planner' || location.pathname === '/report' || location.pathname.startsWith('/planner/'))) {
        plannerResetKeyRef.current += 1
        navigate('/planner', { state: { reset: true, key: plannerResetKeyRef.current } })
      } else {
        navigate(href)
      }
    },
    [navigate, location.pathname],
  )

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

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
      isAdmin={isAdmin}
      language={i18n.language === 'en' ? 'en' : 'de'}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onLanguageChange={(lang) => i18n.changeLanguage(lang)}
    >
      <FaroRoutes>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/planner/:routeId" element={<Suspense fallback={<RidePlannerSkeleton />}><PlannerPage /></Suspense>} />
        <Route path="/planner" element={<Suspense fallback={<RidePlannerSkeleton />}><PlannerPage /></Suspense>} />
        <Route path="/report/:routeId" element={<Suspense fallback={<RidePlannerSkeleton />}><ReportPage /></Suspense>} />
        <Route path="/report" element={<Suspense fallback={<RidePlannerSkeleton />}><ReportPage /></Suspense>} />
        <Route path="/shared/:token" element={<Suspense fallback={<RidePlannerSkeleton />}><SharedReportPage /></Suspense>} />
        {/* <Route path="/products" element={<Suspense fallback={<ProductCategoriesSkeleton />}><ProductsPage /></Suspense>} /> */}
        {/* <Route path="/products/:categoryId" element={<Suspense fallback={<ProductCategoryDetailSkeleton />}><ProductCategoryPage /></Suspense>} /> */}
        <Route path="/routes" element={<Suspense fallback={<MyRoutesSkeleton />}><RequireAuth><RoutesPage /></RequireAuth></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<AuthPageSkeleton />}><LoginPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<AuthPageSkeleton />}><ForgotPasswordPage /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<AuthPageSkeleton />}><ResetPasswordPage /></Suspense>} />
        <Route path="/change-password" element={<Suspense fallback={<AuthPageSkeleton />}><RequireAuth><ChangePasswordPage /></RequireAuth></Suspense>} />
        <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
        <Route path="/about-me" element={<Suspense fallback={<ContentPageSkeleton sections={3} />}><AboutMePage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<ContentPageSkeleton sections={3} />}><AboutAppPage /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<ContentPageSkeleton sections={5} />}><FaqPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<ContentPageSkeleton sections={4} maxWidth="max-w-[480px]" />}><ContactPage /></Suspense>} />
        <Route path="/imprint" element={<Suspense fallback={<ContentPageSkeleton sections={4} />}><ImprintPage /></Suspense>} />
        <Route path="/privacy-policy" element={<Suspense fallback={<ContentPageSkeleton sections={7} />}><PrivacyPolicyPage /></Suspense>} />

        {/* Admin routes */}
        <Route path="/admin" element={<Suspense fallback={<ContentPageSkeleton sections={3} />}><RequireAdmin><AdminLayout /></RequireAdmin></Suspense>}>
          <Route index element={<Suspense fallback={null}><AdminDashboardPage /></Suspense>} />
          <Route path="products" element={<Suspense fallback={null}><AdminProductsPage /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={null}><AdminCategoriesPage /></Suspense>} />
          <Route path="shops" element={<Suspense fallback={null}><AdminShopsPage /></Suspense>} />
          <Route path="faq" element={<Suspense fallback={null}><AdminFaqPage /></Suspense>} />
          <Route path="about" element={<Suspense fallback={null}><AdminAboutPage /></Suspense>} />
          <Route path="contacts" element={<Suspense fallback={null}><AdminContactsPage /></Suspense>} />
        </Route>
      </FaroRoutes>
      <ToastContainer />
    </AppShell>
  )
}

export default function App() {
  return (
    <FaroErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </FaroErrorBoundary>
  )
}
