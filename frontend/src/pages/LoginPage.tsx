import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthPage } from '../components/auth'
import type { LoginFormData, RegisterFormData } from '../components/auth/types'

const USER_STORAGE_KEY = 'bike-weather:user'

export interface LoginPageProps {
  onAuthSuccess: (user: { name: string }) => void
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  // Where to redirect after login — default to /planner
  const from = (location.state as { from?: string })?.from ?? '/planner'

  function simulateAuth(name: string) {
    setIsLoading(true)
    setErrorMessage(undefined)
    // Simulate a short network delay
    setTimeout(() => {
      const user = { name }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      onAuthSuccess(user)
      setIsLoading(false)
      navigate(from, { replace: true })
    }, 600)
  }

  const handleLogin = (data: LoginFormData) => {
    // Extract display name from email
    const name = data.email.split('@')[0]
    simulateAuth(name)
  }

  const handleRegister = (data: RegisterFormData) => {
    const name = data.email.split('@')[0]
    simulateAuth(name)
  }

  const handleGoogleLogin = () => {
    simulateAuth('Google User')
  }

  const handleForgotPassword = () => {
    setErrorMessage('Password reset is not yet available.')
  }

  return (
    <AuthPage
      isLoading={isLoading}
      errorMessage={errorMessage}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onGoogleLogin={handleGoogleLogin}
      onForgotPassword={handleForgotPassword}
    />
  )
}
