export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
}

export interface FaqPageProps {
  items: FaqItem[]
  /** Slug of the category section to auto-open (from URL hash). */
  initialSection?: string
}
