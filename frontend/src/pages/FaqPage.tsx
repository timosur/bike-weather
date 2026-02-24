import { FaqPage as FaqPageComponent } from '../components/faq'
import { faqItems } from '../data/sample-faq'

export default function FaqPage() {
  return <FaqPageComponent items={faqItems} />
}
