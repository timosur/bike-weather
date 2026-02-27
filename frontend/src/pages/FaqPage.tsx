import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { FaqPage as FaqPageComponent } from '../components/faq'
import { ContentPageSkeleton } from '../components/skeleton'
import { SEO } from '../hooks/useSEO'
import { JsonLd } from '../components/seo'
import { fetchFaqItems } from '../api/faq'
import type { FaqItem } from '../components/faq/types'

export default function FaqPage() {
  const { i18n } = useTranslation()
  const { hash } = useLocation()
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (items.length === 0) setLoading(true)
    fetchFaqItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [i18n.language])

  // Scroll to anchor after items load
  useEffect(() => {
    if (!loading && items.length > 0 && hash) {
      const id = hash.replace('#', '')
      // Small delay to let the DOM render the section IDs
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, items, hash])

  if (loading && items.length === 0) return <ContentPageSkeleton sections={5} />

  // Build FAQ JSON-LD structured data
  const faqJsonLd = items.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null

  return (
    <>
      <SEO titleKey="faq" path="/faq" />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <FaqPageComponent items={items} initialSection={hash ? hash.replace('#', '') : undefined} />
    </>
  )
}
