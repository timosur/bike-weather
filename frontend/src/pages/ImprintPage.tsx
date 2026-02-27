import { Imprint } from '../components/imprint'
import { SEO } from '../hooks/useSEO'

export default function ImprintPage() {
  return (
    <>
      <SEO titleKey="imprint" path="/imprint" />
      <Imprint />
    </>
  )
}
