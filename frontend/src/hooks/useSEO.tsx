import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const SITE_URL = 'https://bike-weather.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export interface SEOProps {
  /** i18n key prefix under "seo.*", e.g. "planner" → uses seo.planner.title / seo.planner.description */
  titleKey: string
  /** Path for canonical URL, e.g. "/planner" */
  path: string
  /** If true, adds noindex,nofollow robots meta */
  noIndex?: boolean
  /** Override OG image URL */
  ogImage?: string
  /** Override og:type (default: "website") */
  ogType?: string
}

/** SEO component — renders document metadata using React 19 native support */
export function SEO({ titleKey, path, noIndex, ogImage, ogType = 'website' }: SEOProps) {
  const { t, i18n } = useTranslation()

  const title = t(`seo.${titleKey}.title`)
  const description = t(`seo.${titleKey}.description`)
  const canonicalUrl = `${SITE_URL}${path}`
  const ogLocale = i18n.language === 'en' ? 'en_US' : 'de_DE'
  const ogLocaleAlt = i18n.language === 'en' ? 'de_DE' : 'en_US'
  const image = ogImage || DEFAULT_OG_IMAGE

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical & hreflang */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="de" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={t('shell.brand')} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  )
}
