export function PrivacyPolicy() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Privacy Policy
        </h1>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Table of contents */}
          <nav className="space-y-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Contents
            </h2>
            <ol className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1 list-decimal list-inside">
              <li><a href="#verantwortlicher" className="hover:underline">Responsible party</a></li>
              <li><a href="#erhobene-daten" className="hover:underline">Data collected</a></li>
              <li><a href="#rechtsgrundlagen" className="hover:underline">Legal basis</a></li>
              <li><a href="#cookies" className="hover:underline">Cookies &amp; Tracking</a></li>
              <li><a href="#drittanbieter" className="hover:underline">Third parties</a></li>
              <li><a href="#nutzerrechte" className="hover:underline">Your rights</a></li>
              <li><a href="#kontakt-datenschutz" className="hover:underline">Contact</a></li>
            </ol>
          </nav>

          <section id="verantwortlicher" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">1. Responsible party</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>Timo [Nachname]</p>
              <p>[Adresse]</p>
              <p>E-Mail: [deine@email.de]</p>
            </div>
          </section>

          <section id="erhobene-daten" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">2. Data collected</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">Location data</h3>
                <p>When using the GPS feature, your location is determined to retrieve weather data. The location is not stored and is only used for the current request.</p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">Usage data</h3>
                <p>When visiting the website, technical data is automatically collected (IP address, browser type, access time). This data is used to ensure operation and is not evaluated on a personal basis.</p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">Account data</h3>
                <p>Upon registration, we store your email address and an encrypted password. With Google login, we receive your name and email address from Google.</p>
              </div>
            </div>
          </section>

          <section id="rechtsgrundlagen" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">3. Legal basis</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              The processing of personal data is based on Art. 6 Abs. 1 DSGVO: consent (lit. a) for location data and cookies, contract fulfillment (lit. b) for account data, and legitimate interest (lit. f) for usage data to ensure operation.
            </p>
          </section>

          <section id="cookies" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">4. Cookies &amp; Tracking</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-2">
              <p>This website uses technically necessary cookies for session management and optional analytics cookies (Google Analytics) to improve the service.</p>
              <p>Google Ads are displayed to keep the app free. Google may set cookies and collect data. For more information, see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-emerald-600 dark:text-emerald-400 hover:underline">Google's Privacy Policy</a>.</p>
            </div>
          </section>

          <section id="drittanbieter" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">5. Third parties</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-2">
              <p><strong className="text-stone-700 dark:text-stone-300">Weather API:</strong> To retrieve weather data, your selected location is transmitted to an external weather service.</p>
              <p><strong className="text-stone-700 dark:text-stone-300">Google Login:</strong> When using Google login, data is exchanged with Google in accordance with their privacy policy.</p>
              <p><strong className="text-stone-700 dark:text-stone-300">Affiliate links:</strong> Product links lead to external shops. Cookies may be set when clicking.</p>
            </div>
          </section>

          <section id="nutzerrechte" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">6. Your rights</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              You have the right to access, rectification, deletion, and restriction of processing of your personal data. You can revoke your consent at any time and have a right to data portability. In case of complaints, you can contact the relevant supervisory authority.
            </p>
          </section>

          <section id="kontakt-datenschutz" className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">7. Contact</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              For privacy-related questions, you can reach me at <a href="mailto:[deine@email.de]" className="text-emerald-600 dark:text-emerald-400 hover:underline">[deine@email.de]</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
