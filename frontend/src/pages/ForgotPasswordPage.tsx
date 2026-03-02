import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { forgotPassword } from '../api/auth'
import { SEO } from '../hooks/useSEO'
import { TurnstileWidget, useTurnstile } from '../components/common/TurnstileWidget'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string>()
  const turnstile = useTurnstile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.validation.emailRequired'))
      return
    }
    setError(undefined)
    setIsSubmitting(true)
    try {
      await forgotPassword(email, turnstile.getToken() ?? undefined)
      setIsSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPassword.error'))
      turnstile.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO titleKey="forgotPassword" path="/forgot-password" noIndex />
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 p-8">
            {isSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-white font-outfit">
                  {t('auth.forgotPassword.sentHeading')}
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                  {t('auth.forgotPassword.sentText')}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mt-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-white font-outfit">
                    {t('auth.forgotPassword.heading')}
                  </h1>
                  <p className="text-stone-600 dark:text-stone-400 mt-2">
                    {t('auth.forgotPassword.subheading')}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t('contact.email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('contact.emailPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <TurnstileWidget
                    key={turnstile.resetKey}
                    onVerify={turnstile.onVerify}
                    onExpire={turnstile.onExpire}
                    onError={turnstile.onError}
                    className="flex justify-center"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('auth.forgotPassword.submit')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
