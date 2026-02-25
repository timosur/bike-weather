export type ContactCategory = 'feedback' | 'bug' | 'feature' | 'sonstiges'

export interface ContactFormData {
  category: ContactCategory
  name: string
  email: string
  message: string
  captchaToken?: string
}

export interface ContactPageProps {
  isLoading?: boolean
  isSuccess?: boolean
  errorMessage?: string
  onSubmit?: (data: ContactFormData) => void
}
