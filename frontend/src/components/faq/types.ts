export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
}

export interface FaqPageProps {
  items: FaqItem[]
}
