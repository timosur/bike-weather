import { useTranslation } from 'react-i18next'

export function PrivacyPolicy() {
  const { t } = useTranslation()

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('privacy.heading')}
        </h1>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Table of contents */}
          <nav className="space-y-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {t('privacy.contents')}
            </h2>
            <ol className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1 list-decimal list-inside">
              <li><a href="#verantwortlicher" className="hover:underline">{t('privacy.section.responsible.navTitle')}</a></li>
              <li><a href="#erhobene-daten" className="hover:underline">{t('privacy.section.dataCollected.navTitle')}</a></li>
              <li><a href="#rechtsgrundlagen" className="hover:underline">{t('privacy.section.legalBasis.navTitle')}</a></li>
              <li><a href="#cookies" className="hover:underline">{t('privacy.section.cookies.navTitle')}</a></li>
              <li><a href="#drittanbieter" className="hover:underline">{t('privacy.section.thirdParties.navTitle')}</a></li>
              <li><a href="#nutzerrechte" className="hover:underline">{t('privacy.section.rights.navTitle')}</a></li>
              <li><a href="#kontakt-datenschutz" className="hover:underline">{t('privacy.section.contactPrivacy.navTitle')}</a></li>
            </ol>
          </nav>

          <section id="verantwortlicher" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.responsible.title')}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>Timo [Nachname]</p>
              <p>[Adresse]</p>
              <p>E-Mail: [deine@email.de]</p>
            </div>
          </section>

          <section id="erhobene-daten" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.dataCollected.title')}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('privacy.section.dataCollected.locationData')}</h3>
                <p>{t('privacy.section.dataCollected.locationDataText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('privacy.section.dataCollected.usageData')}</h3>
                <p>{t('privacy.section.dataCollected.usageDataText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">{t('privacy.section.dataCollected.accountData')}</h3>
                <p>{t('privacy.section.dataCollected.accountDataText')}</p>
              </div>
            </div>
          </section>

          <section id="rechtsgrundlagen" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.legalBasis.title')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('privacy.section.legalBasis.text')}
            </p>
          </section>

          <section id="cookies" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.cookies.title')}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-2">
              <p>{t('privacy.section.cookies.text1')}</p>
              <p>{t('privacy.section.cookies.text2before')} <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">{t('privacy.section.cookies.text2link')}</a>.</p>
            </div>
          </section>

          <section id="drittanbieter" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.thirdParties.title')}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-2">
              <p><strong className="text-stone-700 dark:text-stone-300">{t('privacy.section.thirdParties.weatherApi')}</strong> {t('privacy.section.thirdParties.weatherApiText')}</p>
              <p><strong className="text-stone-700 dark:text-stone-300">{t('privacy.section.thirdParties.googleLogin')}</strong> {t('privacy.section.thirdParties.googleLoginText')}</p>
              <p><strong className="text-stone-700 dark:text-stone-300">{t('privacy.section.thirdParties.affiliateLinks')}</strong> {t('privacy.section.thirdParties.affiliateLinksText')}</p>
            </div>
          </section>

          <section id="nutzerrechte" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.rights.title')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('privacy.section.rights.text')}
            </p>
          </section>

          <section id="kontakt-datenschutz" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t('privacy.section.contactPrivacy.title')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('privacy.section.contactPrivacy.text')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
