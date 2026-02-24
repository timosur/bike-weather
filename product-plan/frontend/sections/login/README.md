# Login & Registration

## Overview

Authentication page for users who want to use saved routes and personal profiles. Supports email/password login and registration, plus Google login. The app works without an account -- this is an optional feature. Minimalist design with a centered card layout.

## User Flows

1. **Sign In:** User enters email and password, clicks "Sign in".
2. **Register:** User switches to the "Register" tab, enters email, password, and password confirmation, clicks "Register".
3. **Google Login:** User clicks the "Continue with Google" button.
4. **Forgot Password:** User clicks "Forgot password?" link below the login form.
5. **Tab Toggle:** User switches between "Sign in" and "Register" tabs.
6. **Error Display:** If login or registration fails, an error message appears inline.
7. **Success:** After successful login, user is redirected to the previous page.

## Components Provided

### `AuthPage`

The complete authentication page component. Renders a centered card (~400px max-width) with tab toggle, login form, registration form, Google login button, forgot password link, and a notice that no account is required.

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onLogin` | `(data: LoginFormData) => void` | Called when the user submits the login form. Host should authenticate the user. |
| `onRegister` | `(data: RegisterFormData) => void` | Called when the user submits the registration form. Host should create the account. |
| `onGoogleLogin` | `() => void` | Called when the user clicks the Google login button. Host should initiate OAuth flow. |
| `onForgotPassword` | `() => void` | Called when the user clicks "Forgot password?". Host should navigate to the password reset flow. |

## Data Dependencies

- `activeTab?: AuthTab` -- Currently active tab ("login" or "register")
- `isLoading?: boolean` -- Loading state for the submit button
- `errorMessage?: string` -- Error message to display inline
