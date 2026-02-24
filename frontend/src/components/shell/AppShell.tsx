import { useState } from 'react'
import { Menu, X, Bike } from 'lucide-react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'

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
  language = 'de',
  onNavigate,
  onLogout,
  onLanguageChange,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = navigationItems.filter(item => !item.requiresAuth || user)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-6">
            {/* Logo */}
            <button
              onClick={() => onNavigate?.('/')}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <Bike className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span
                className="font-semibold text-stone-900 dark:text-stone-100 text-base"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Fahrrad Wetter
              </span>
            </button>

            {/* Desktop Nav */}
            <MainNav
              items={visibleItems}
              onNavigate={onNavigate}
              className="hidden md:flex"
            />

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <button
                onClick={() => onLanguageChange?.(language === 'de' ? 'en' : 'de')}
                className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-2 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {language === 'de' ? 'EN' : 'DE'}
              </button>
              {user && (
                <UserMenu user={user} onLogout={onLogout} />
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
                <button
                  key={item.href}
                  onClick={() => {
                    onNavigate?.(item.href)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                onClick={() => onLanguageChange?.(language === 'de' ? 'en' : 'de')}
                className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-3 py-2 rounded transition-colors"
              >
                {language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
              </button>
              {user && (
                <button
                  onClick={() => {
                    onLogout?.()
                    setMobileMenuOpen(false)
                  }}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      {footerSections.length > 0 && (
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {/* Brand column */}
              <div className="col-span-2 sm:col-span-1 space-y-3">
                <button
                  onClick={() => onNavigate?.('/')}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <Bike className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span
                    className="font-semibold text-stone-900 dark:text-stone-100 text-sm"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Fahrrad Wetter
                  </span>
                </button>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
                  Weather-based clothing recommendations for cyclists.
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
                        <button
                          onClick={() => onNavigate?.(link.href)}
                          className="text-sm text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                &copy; {new Date().getFullYear()} Fahrrad Wetter. A project by Timo.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate?.('/imprint')}
                  className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  Imprint
                </button>
                <button
                  onClick={() => onNavigate?.('/privacy-policy')}
                  className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  Privacy
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
