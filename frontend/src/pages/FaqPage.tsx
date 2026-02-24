import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FaqPage as FaqPageComponent } from '../components/faq'
import { ContentPageSkeleton } from '../components/skeleton'
import { fetchFaqItems } from '../api/faq'
import type { FaqItem } from '../components/faq/types'

export default function FaqPage() {
  const { i18n } = useTranslation()
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchFaqItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading) return <ContentPageSkeleton sections={5} />

  return <FaqPageComponent items={items} />
}
