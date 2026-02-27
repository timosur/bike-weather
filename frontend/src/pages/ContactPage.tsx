import { useState, useCallback } from 'react'
import { ContactPage as ContactPageComponent } from '../components/contact'
import { SEO } from '../hooks/useSEO'
import type { ContactFormData } from '../components/contact/types'
import { submitContactForm } from '../api/contact'

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = useCallback(async (data: ContactFormData) => {
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      await submitContactForm(data)
      setIsSuccess(true)
    } catch {
      setErrorMessage('Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <>
      <SEO titleKey="contact" path="/contact" />
      <ContactPageComponent
        isLoading={isLoading}
        isSuccess={isSuccess}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </>
  )
}
