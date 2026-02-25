import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AboutMe } from '../components/about-me'
import { ContentPageSkeleton } from '../components/skeleton'
import { fetchAboutSections } from '../api/about'
import type { AboutSection } from '../api/about'

export default function AboutMePage() {
  const { i18n } = useTranslation()
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only show skeleton on initial load, not on language switch
    if (sections.length === 0) setLoading(true)
    fetchAboutSections()
      .then(setSections)
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading && sections.length === 0) return <ContentPageSkeleton sections={3} />

  return <AboutMe sections={sections} />
}
