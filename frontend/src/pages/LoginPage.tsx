import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthPage } from '../components/auth'
import type { LoginFormData, RegisterFormData } from '../components/auth/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, login, register } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/planner', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleLogin = async (data: LoginFormData) => {
    setError(undefined)
    setIsSubmitting(true)
    try {
      await login(data.username, data.password, data.captchaToken)
      navigate('/planner', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (data: RegisterFormData) => {
    setError(undefined)
    setIsSubmitting(true)
    try {
      await register(data.username, data.email, data.password, undefined, data.captchaToken)
      navigate('/planner', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPage
      isLoading={isSubmitting}
      errorMessage={error}
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  )
}
