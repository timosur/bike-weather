import { useState, useCallback } from 'react'
import { ContactPage as ContactPageComponent } from '../components/contact'
import type { ContactFormData } from '../components/contact/types'

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = useCallback((data: ContactFormData) => {
    setIsLoading(true)
    setErrorMessage(undefined)
    // Simulate sending the message
    setTimeout(() => {
      console.log('Contact form submitted:', data)
      setIsLoading(false)
      setIsSuccess(true)
    }, 800)
  }, [])

  return (
    <ContactPageComponent
      isLoading={isLoading}
      isSuccess={isSuccess}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
    />
  )
}
