import { useState, useEffect } from 'react'
import { AboutMe } from '../components/about-me'
import { ContentPageSkeleton } from '../components/skeleton'
import { fetchAboutSections } from '../api/about'
import type { AboutSection } from '../api/about'

export default function AboutMePage() {
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutSections()
      .then(setSections)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ContentPageSkeleton sections={3} />

  return <AboutMe sections={sections} />
}
