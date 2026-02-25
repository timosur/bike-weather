import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { AuthPageProps, AuthTab, LoginFormData, RegisterFormData } from '../types'

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
  const [loginForm, setLoginForm] = useState<LoginFormData>({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({ email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateLogin = () => {
    const errs: Record<string, string> = {}
    if (!loginForm.email || !/\S+@\S+\.\S+/.test(loginForm.email)) errs.email = 'Valid email required'
    if (!loginForm.password) errs.password = 'Password required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateRegister = () => {
    const errs: Record<string, string> = {}
    if (!registerForm.email || !/\S+@\S+\.\S+/.test(registerForm.email)) errs.email = 'Valid email required'
    if (!registerForm.password || registerForm.password.length < 8) errs.password = 'At least 8 characters'
    if (registerForm.password !== registerForm.passwordConfirm) errs.passwordConfirm = 'Passwords do not match'
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
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {tab === 'login'
              ? 'Sign in to see your saved routes.'
              : 'Create an account to save routes.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* Tab toggle */}
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setErrors({}) }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
              >
                {t === 'login' ? 'Sign in' : 'Register'}
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

            {/* Login form */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
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
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Sign in
                </button>
              </form>
            )}

            {/* Register form */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                      placeholder="Password (min. 8 characters)"
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
                      placeholder="Confirm password"
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
                  Register
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Optional hint */}
        <p className="text-center text-xs text-stone-400 dark:text-stone-500">
          No account needed — you can use Fahrrad Wetter without signing up.
        </p>
      </div>
    </div>
  )
}
