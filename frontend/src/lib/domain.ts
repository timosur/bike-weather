/** Domain-to-language mapping for multi-domain SEO setup. */

export const DOMAINS = {
  de: 'https://fahrrad-wetter.com',
  en: 'https://bike-weather.com',
} as const

type Lang = keyof typeof DOMAINS

const HOSTNAME_TO_LANG: Record<string, Lang> = {
  'fahrrad-wetter.com': 'de',
  'www.fahrrad-wetter.com': 'de',
  'bike-weather.com': 'en',
  'www.bike-weather.com': 'en',
}

/** Detect language from the current hostname, or null if unknown (e.g. localhost). */
export function detectLangFromHostname(): Lang | null {
  if (typeof window === 'undefined') return null
  return HOSTNAME_TO_LANG[window.location.hostname] ?? null
}

/** Get the canonical base URL for the current hostname. Falls back to bike-weather.com. */
export function getSiteUrl(): string {
  const lang = detectLangFromHostname()
  return lang ? DOMAINS[lang] : DOMAINS.en
}

/** Get the base URL for a specific language's domain. */
export function getDomainForLang(lang: string): string {
  return lang === 'de' ? DOMAINS.de : DOMAINS.en
}
