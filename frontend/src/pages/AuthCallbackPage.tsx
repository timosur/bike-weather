import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOidcCallback } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>()

  useEffect(() => {
    handleOidcCallback()
      .then(() => navigate('/planner', { replace: true }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Authentication failed'))
  }, [navigate])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">Authentication Error</h1>
          <p className="text-stone-600 dark:text-stone-400">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-stone-500 dark:text-stone-400">Completing sign-in...</p>
    </div>
  )
}
