import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AboutApp } from '../components/about-app'
import { ContentPageSkeleton } from '../components/skeleton'
import { SEO } from '../hooks/useSEO'
import { fetchAppInfoSections } from '../api/appInfo'
import type { AppInfoSection } from '../api/appInfo'

export default function AboutAppPage() {
  const { i18n } = useTranslation()
  const [sections, setSections] = useState<AppInfoSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only show skeleton on initial load, not on language switch
    if (sections.length === 0) setLoading(true)
    fetchAppInfoSections()
      .then(setSections)
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading && sections.length === 0) return <ContentPageSkeleton sections={3} />

  return (
    <>
      <SEO titleKey="aboutApp" path="/about" />
      <AboutApp sections={sections} />
    </>
  )
}
