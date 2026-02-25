import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { AuthPageProps, AuthTab, LoginFormData, RegisterFormData } from './types'

export function AuthPage({
  activeTab: initialTab = 'login',
  isLoading = false,
  errorMessage,
  onLogin,
  onRegister,
  onGoogleLogin,
  onForgotPassword,
}: AuthPageProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState<LoginFormData>({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({ username: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { t } = useTranslation()

  const validateLogin = () => {
    const errs: Record<string, string> = {}
    if (!loginForm.username) errs.username = t('auth.validation.usernameRequired')
    if (!loginForm.password) errs.password = t('auth.validation.passwordRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateRegister = () => {
    const errs: Record<string, string> = {}
    if (!registerForm.username) errs.username = t('auth.validation.usernameRequired')
    if (!registerForm.email || !/\S+@\S+\.\S+/.test(registerForm.email)) errs.email = t('auth.validation.emailRequired')
    if (!registerForm.password || registerForm.password.length < 8) errs.password = t('auth.validation.passwordMin')
    if (registerForm.password !== registerForm.passwordConfirm) errs.passwordConfirm = t('auth.validation.passwordMismatch')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateLogin()) onLogin?.(loginForm)
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateRegister()) onRegister?.(registerForm)
  }

  const inputBase =
    'w-full rounded-xl text-sm bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-2.5'

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1
            className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {tab === 'login' ? t('auth.login.heading') : t('auth.register.heading')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {tab === 'login'
              ? t('auth.login.subheading')
              : t('auth.register.subheading')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* Tab toggle */}
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            {(['login', 'register'] as const).map(tabKey => (
              <button
                key={tabKey}
                type="button"
                onClick={() => { setTab(tabKey); setErrors({}) }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === tabKey
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
              >
                {tabKey === 'login' ? t('auth.login.tab') : t('auth.register.tab')}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {/* Error message */}
            {errorMessage && (
              <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Google Login */}
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('auth.googleLogin')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              <span className="text-xs text-stone-400 dark:text-stone-500">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>

            {/* Login form */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                      placeholder={t('auth.login.usernamePlaceholder')}
                      className={`${inputBase} pl-9 pr-4 ${errors.username ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                  </div>
                  {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Password"
                      className={`${inputBase} pl-9 pr-10 ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={onForgotPassword} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('auth.login.submit')}
                </button>
              </form>
            )}

            {/* Register form */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                      placeholder={t('auth.register.usernamePlaceholder')}
                      className={`${inputBase} pl-9 pr-4 ${errors.username ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                  </div>
                  {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Email"
                      className={`${inputBase} pl-9 pr-4 ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={t('auth.register.passwordPlaceholder')}
                      className={`${inputBase} pl-9 pr-10 ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="password"
                      value={registerForm.passwordConfirm}
                      onChange={e => setRegisterForm(f => ({ ...f, passwordConfirm: e.target.value }))}
                      placeholder={t('auth.register.confirmPassword')}
                      className={`${inputBase} pl-9 pr-4 ${errors.passwordConfirm ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'}`}
                    />
                  </div>
                  {errors.passwordConfirm && <p className="text-xs text-red-500">{errors.passwordConfirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('auth.register.submit')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Optional hint */}
        <p className="text-center text-xs text-stone-400 dark:text-stone-500">
          {t('auth.noAccountNeeded')}
        </p>
      </div>
    </div>
  )
}
