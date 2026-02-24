import { useState, useEffect } from 'react'
import { FaqPage as FaqPageComponent } from '../components/faq'
import { ContentPageSkeleton } from '../components/skeleton'
import { fetchFaqItems } from '../api/faq'
import type { FaqItem } from '../components/faq/types'

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFaqItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ContentPageSkeleton sections={5} />

  return <FaqPageComponent items={items} />
}
