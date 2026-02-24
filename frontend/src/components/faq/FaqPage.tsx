import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FaqPageProps } from './types'

export function FaqPage({ items }: FaqPageProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const { t } = useTranslation()

  const categories = [...new Set(items.map(i => i.category))]

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1
            className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('faq.heading')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {t('faq.subheading')}
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {category}
              </h2>
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                {items
                  .filter(i => i.category === category)
                  .map(item => {
                    const isOpen = openId === item.id
                    return (
                      <div key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                        >
                          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            strokeWidth={2}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isOpen ? 'max-h-96' : 'max-h-0'
                          }`}
                        >
                          <p className="px-5 pb-4 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('faq.questionNotListed')}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {t('faq.contactHint.before')}{' '}
              <Link to="/contact" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                {t('faq.contactHint.link')}
              </Link>{' '}
              {t('faq.contactHint.after')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
