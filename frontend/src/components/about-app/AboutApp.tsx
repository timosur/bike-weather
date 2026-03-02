import { CloudSun, Target, Cog, ArrowRight, Bike, Coffee } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { AppInfoSection } from '../../api/appInfo'

const sectionIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  what: {
    icon: <CloudSun className="w-3.5 h-3.5 text-sky-500" strokeWidth={1.5} />,
    bg: 'bg-sky-50 dark:bg-sky-950/30',
  },
  why: {
    icon: <Target className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  how: {
    icon: <Cog className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
}

const defaultIcon = {
  icon: <Cog className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />,
  bg: 'bg-stone-50 dark:bg-stone-950/30',
}

export interface AboutAppProps {
  sections?: AppInfoSection[]
}

export function AboutApp({ sections }: AboutAppProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
            <CloudSun className="w-4 h-4 text-sky-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-sky-700 dark:text-sky-300">{t('aboutApp.badge')}</span>
          </div>
          <h1
            className="text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('aboutApp.heading')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto leading-relaxed">
            {t('aboutApp.intro')}
          </p>
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {sections?.map((section) => {
              const { icon, bg } = sectionIcons[section.section_key] ?? defaultIcon
              return (
                <section key={section.section_key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{section.title}</h2>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {section.body}
                  </p>
                </section>
              )
            })}
          </div>

          {/* CTA */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <Link
              to="/planner"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <Bike className="w-4 h-4" strokeWidth={1.5} />
              {t('aboutApp.planYourRide')}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('aboutApp.support.heading')}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t('aboutApp.support.body')}</p>
          </div>
          <a
            href="https://buymeacoffee.com/timosur"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
          >
            <Coffee className="w-4 h-4" strokeWidth={1.5} />
            {t('aboutApp.support.cta')}
          </a>
        </div>
      </div>
    </div>
  )
}
