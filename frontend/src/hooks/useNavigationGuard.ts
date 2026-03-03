import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationGuardState {
  /** Whether the guard dialog should be shown */
  isBlocked: boolean
  /** Call to proceed with the blocked navigation */
  proceed: () => void
  /** Call to cancel the blocked navigation and stay */
  reset: () => void
}

/**
 * Custom navigation guard hook that works with BrowserRouter.
 * Intercepts browser back/forward and in-app link clicks when `shouldBlock` is true.
 */
export function useNavigationGuard(shouldBlock: boolean): NavigationGuardState {
  const navigate = useNavigate()
  const location = useLocation()

  const [isBlocked, setIsBlocked] = useState(false)
  const shouldBlockRef = useRef(shouldBlock)
  const pendingNavRef = useRef<string | null>(null)
  const isProceeding = useRef(false)

  // Keep ref in sync
  useEffect(() => {
    shouldBlockRef.current = shouldBlock
    // If blocking turned off while dialog is open, close it
    if (!shouldBlock && isBlocked) {
      setIsBlocked(false)
      pendingNavRef.current = null
    }
  }, [shouldBlock, isBlocked])

  // Handle browser back/forward (popstate)
  useEffect(() => {
    if (!shouldBlock) return

    const handlePopState = () => {
      if (isProceeding.current) {
        isProceeding.current = false
        return
      }
      if (!shouldBlockRef.current) return

      // Push current state back to undo the back navigation
      window.history.pushState(null, '', location.pathname + location.search)
      pendingNavRef.current = '__popstate__'
      setIsBlocked(true)
    }

    // Push a sentinel state so we can detect back navigation
    window.history.pushState(null, '', location.pathname + location.search)

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [shouldBlock, location.pathname, location.search])

  // Handle beforeunload (browser close/reload)
  useEffect(() => {
    if (!shouldBlock) return

    const handleBeforeUnload = (e: BeforeEvent) => {
      e.preventDefault()
      // Modern browsers ignore custom messages but still show a generic dialog
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [shouldBlock])

  const proceed = useCallback(() => {
    const pending = pendingNavRef.current
    pendingNavRef.current = null
    setIsBlocked(false)

    if (pending === '__popstate__') {
      // Go back (the original back action the user tried)
      isProceeding.current = true
      window.history.go(-1)
    } else if (pending) {
      navigate(pending)
    }
  }, [navigate])

  const reset = useCallback(() => {
    pendingNavRef.current = null
    setIsBlocked(false)
  }, [])

  return { isBlocked, proceed, reset }
}

type BeforeEvent = BeforeUnloadEvent
