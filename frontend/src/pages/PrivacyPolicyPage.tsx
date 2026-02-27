import { PrivacyPolicy } from '../components/privacy-policy'
import { SEO } from '../hooks/useSEO'

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO titleKey="privacyPolicy" path="/privacy-policy" />
      <PrivacyPolicy />
    </>
  )
}
