export function Imprint() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Imprint
        </h1>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-8">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Information according to § 5 TMG
            </h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>Timo [Nachname]</p>
              <p>[Street and house number]</p>
              <p>[Postal code] [City]</p>
              <p>Germany</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Contact</h2>
            <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>E-Mail: [deine@email.de]</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Liability for content
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              As a service provider, we are responsible for our own content on these pages in accordance with § 7 (1) TMG under general law. According to §§ 8 to 10 TMG, however, we as a service provider are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Liability for links
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Our website contains links to external third-party websites, over whose content we have no influence. Therefore, we cannot assume any liability for this third-party content. The respective provider or operator of the linked pages is always responsible for their content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Urheberrecht</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              The content and works created by the site operator on these pages are subject to German copyright law. Reproduction, editing, distribution, and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
