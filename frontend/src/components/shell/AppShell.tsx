import { useState } from 'react'
import { Menu, X, LogIn, KeyRound, Shield, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'
import { SegmentedToggle } from './SegmentedToggle'
import { useTheme } from '@/hooks/useTheme'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
  requiresAuth?: boolean
}

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  footerSections?: FooterSection[]
  user?: { name: string; avatarUrl?: string }
  isAdmin?: boolean
  language?: 'de' | 'en'
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onLanguageChange?: (lang: 'de' | 'en') => void
}

export function AppShell({
  children,
  navigationItems,
  footerSections = [],
  user,
  isAdmin,
  language = 'de',
  onNavigate,
  onLogout,
  onLanguageChange,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()
  const { t } = useTranslation()

  const visibleItems = navigationItems.filter(item => !item.requiresAuth || user)

  return (
    <div className="min-h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950 overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-6">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); onNavigate?.('/') }}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-4 h-4" fill="currentColor">
                  <path d="M25,30a6,6,0,1,1,6-6A6.0069,6.0069,0,0,1,25,30Zm0-10a4,4,0,1,0,4,4A4.0045,4.0045,0,0,0,25,20Z" />
                  <path d="M7,30a6,6,0,1,1,6-6A6.0069,6.0069,0,0,1,7,30ZM7,20a4,4,0,1,0,4,4A4.0045,4.0045,0,0,0,7,20Z" />
                  <path d="M17,27H15V20.4139L9.5849,15a2.003,2.003,0,0,1,0-2.8292l4.5859-4.5859a2.0024,2.0024,0,0,1,2.8286,0L21.414,12H27v1.9993L20.5853,14l-5-5L11,13.5849l6,6Z" />
                  <path d="M21.5,8A3.5,3.5,0,1,1,25,4.5,3.5042,3.5042,0,0,1,21.5,8Zm0-5A1.5,1.5,0,1,0,23,4.5,1.5017,1.5017,0,0,0,21.5,3Z" />
                </svg>
              </div>
              <span
                className="font-semibold text-stone-900 dark:text-stone-100 text-base"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t('shell.brand')}
              </span>
            </a>

            {/* Desktop Nav */}
            <MainNav
              items={visibleItems}
              onNavigate={onNavigate}
              className="hidden md:flex"
            />

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <SegmentedToggle
                value={language}
                onChange={(v) => onLanguageChange?.(v as 'de' | 'en')}
                options={[
                  { value: 'de', label: '🇩🇪', ariaLabel: 'Deutsch' },
                  { value: 'en', label: '🇬🇧', ariaLabel: 'English' },
                ]}
              />
              {user ? (
                <UserMenu user={user} isAdmin={isAdmin} onNavigate={onNavigate} onLogout={onLogout} />
              ) : (
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('/login') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('common.signIn')}
                </a>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-auto p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3">
            <div className="space-y-1">
              {visibleItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate?.(item.href)
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${item.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
            {user ? (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1">
                <p className="px-3 py-1 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  {user.name}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onNavigate?.('/admin')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
                    {t('common.admin')}
                  </button>
                )}
                <button
                  onClick={() => {
                    onNavigate?.('/change-password')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
                  {t('common.changePassword')}
                </button>
                <button
                  onClick={() => {
                    onLogout?.()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate?.('/login')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('common.signIn')}
                </a>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <SegmentedToggle
                value={language}
                onChange={(v) => onLanguageChange?.(v as 'de' | 'en')}
                options={[
                  { value: 'de', label: '🇩🇪', ariaLabel: 'Deutsch' },
                  { value: 'en', label: '🇬🇧', ariaLabel: 'English' },
                ]}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      {footerSections.length > 0 && (
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {/* Brand column */}
              <div className="col-span-2 sm:col-span-1 space-y-3">
                <a
                  href="/"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('/') }}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M25,30a6,6,0,1,1,6-6A6.0069,6.0069,0,0,1,25,30Zm0-10a4,4,0,1,0,4,4A4.0045,4.0045,0,0,0,25,20Z" />
                      <path d="M7,30a6,6,0,1,1,6-6A6.0069,6.0069,0,0,1,7,30ZM7,20a4,4,0,1,0,4,4A4.0045,4.0045,0,0,0,7,20Z" />
                      <path d="M17,27H15V20.4139L9.5849,15a2.003,2.003,0,0,1,0-2.8292l4.5859-4.5859a2.0024,2.0024,0,0,1,2.8286,0L21.414,12H27v1.9993L20.5853,14l-5-5L11,13.5849l6,6Z" />
                      <path d="M21.5,8A3.5,3.5,0,1,1,25,4.5,3.5042,3.5042,0,0,1,21.5,8Zm0-5A1.5,1.5,0,1,0,23,4.5,1.5017,1.5017,0,0,0,21.5,3Z" />
                    </svg>
                  </div>
                  <span
                    className="font-semibold text-stone-900 dark:text-stone-100 text-sm"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {t('shell.brand')}
                  </span>
                </a>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
                  {t('shell.footer.tagline')}
                </p>
              </div>

              {/* Footer link sections */}
              {footerSections.map(section => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.links.map(link => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={(e) => { e.preventDefault(); onNavigate?.(link.href) }}
                          className="text-sm text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {t('shell.footer.copyright', { year: new Date().getFullYear() })}{' '}
                <a href="https://github.com/timosur" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('shell.footer.copyrightAuthor')}</a>
                {' · '}
                <span className="tabular-nums">v{__APP_VERSION__}</span>
              </p>
              <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('shell.footer.attributionWeather')}</a>
                  {' · '}
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('shell.footer.attributionMap')}</a>
                  {' · '}
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('shell.footer.attributionGeocoding')}</a>
                </span>
                <a
                  href="/imprint"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('/imprint') }}
                  className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  {t('shell.footer.imprint')}
                </a>
                <a
                  href="/privacy-policy"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('/privacy-policy') }}
                  className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  {t('shell.footer.privacy')}
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
