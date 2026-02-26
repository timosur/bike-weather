import { useTranslation } from 'react-i18next'

export function Imprint() {
  const { t } = useTranslation()

  return (
    <div className=" flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('imprint.heading')}
        </h1>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-8">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('imprint.infoHeading')}
            </h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>Timo [Nachname]</p>
              <p>[Street and house number]</p>
              <p>[Postal code] [City]</p>
              <p>Germany</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('imprint.contact')}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>E-Mail: [deine@email.de]</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('imprint.liability')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('imprint.liabilityText')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('imprint.linksHeading')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('imprint.linksText')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('imprint.copyright')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('imprint.copyrightText')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
