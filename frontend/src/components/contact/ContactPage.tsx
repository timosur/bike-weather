import { useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import type { ContactPageProps, ContactCategory, ContactFormData } from './types'

const categories: { value: ContactCategory; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug', label: 'Report bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'sonstiges', label: 'Other' },
]

export function ContactPage({
  isLoading = false,
  isSuccess = false,
  errorMessage,
  onSubmit,
}: ContactPageProps) {
  const [form, setForm] = useState<ContactFormData>({
    category: 'feedback',
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required'
    if (!form.message.trim()) errs.message = 'Please enter a message'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit?.(form)
  }

  const inputBase =
    'w-full rounded-xl text-sm bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all py-2.5 px-4'
  const inputNormal = 'border-stone-200 dark:border-stone-700'
  const inputError = 'border-red-400 dark:border-red-500'

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[480px] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h1
            className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Message sent
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Thank you for your feedback! I read every message and will get back to you as soon as possible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[480px] space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1
            className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Contact &amp; Feedback
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
            Fahrrad Wetter thrives on your feedback. Whether it's a suggestion, bug report, or feature request — I appreciate every message.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-5"
        >
          {errorMessage && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all ${
                    form.category === c.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Name <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className={`${inputBase} ${inputNormal}`}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              E-Mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="What would you like to share?"
              rows={5}
              className={`${inputBase} resize-none ${errors.message ? inputError : inputNormal}`}
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2} />
            )}
            Submit
          </button>
        </form>

        {/* Personal note */}
        <p className="text-center text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
          I read every message personally and respond as soon as possible.
        </p>
      </div>
    </div>
  )
}
