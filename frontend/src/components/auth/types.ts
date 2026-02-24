export type AuthTab = 'login' | 'register'

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  passwordConfirm: string
}

export interface AuthPageProps {
  /** Currently active tab */
  activeTab?: AuthTab
  /** Whether a login/register request is in progress */
  isLoading?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Called when user submits login */
  onLogin?: (data: LoginFormData) => void
  /** Called when user submits registration */
  onRegister?: (data: RegisterFormData) => void
  /** Called when user clicks Google login */
  onGoogleLogin?: () => void
  /** Called when user clicks "Forgot password" */
  onForgotPassword?: () => void
}
