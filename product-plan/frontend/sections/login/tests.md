# Login & Registration Tests

## Overview

Test the AuthPage component including tab toggling between sign in and register, email/password validation, Google login, forgot password flow, loading states, and error display.

## User Flow Tests

### Sign In (Success)

1. Render `AuthPage` with `activeTab: "login"`.
2. Verify the "Sign in" tab is active.
3. Enter "user@example.com" in the email field.
4. Enter "password123" in the password field.
5. Click the "Sign in" button.
6. Verify `onLogin` is called with `{ email: "user@example.com", password: "password123" }`.

### Register (Success)

1. Click the "Register" tab.
2. Verify the registration form is displayed.
3. Enter "newuser@example.com" in the email field.
4. Enter "securePass1!" in the password field.
5. Enter "securePass1!" in the confirm password field.
6. Click the "Register" button.
7. Verify `onRegister` is called with `{ email: "newuser@example.com", password: "securePass1!", passwordConfirm: "securePass1!" }`.

### Tab Toggle

1. Render `AuthPage` with `activeTab: "login"`.
2. Verify login form fields (email, password) are visible.
3. Click the "Register" tab.
4. Verify registration form fields (email, password, confirm password) are visible.
5. Click the "Sign in" tab.
6. Verify login form fields are visible again.

### Email Validation

1. Enter "not-an-email" in the email field.
2. Attempt to submit.
3. Verify an inline validation error appears for the email field (e.g. "Please enter a valid email address").

### Password Length Validation

1. Enter "ab" in the password field (too short).
2. Attempt to submit.
3. Verify an inline validation error appears (e.g. "Password must be at least 8 characters").

### Password Confirmation Mismatch

1. Switch to the "Register" tab.
2. Enter "securePass1!" in the password field.
3. Enter "differentPass" in the confirm password field.
4. Click "Register".
5. Verify an inline validation error appears (e.g. "Passwords do not match").

### Google Login

1. Click the "Continue with Google" button.
2. Verify `onGoogleLogin` is called.

### Forgot Password

1. Ensure the "Sign in" tab is active.
2. Click the "Forgot password?" link.
3. Verify `onForgotPassword` is called.

### Error State

1. Render `AuthPage` with `errorMessage: "Invalid email or password"`.
2. Verify the error message "Invalid email or password" is displayed inline.

### Loading State

1. Render `AuthPage` with `isLoading: true`.
2. Verify the "Sign in" (or "Register") button shows a loading spinner or is disabled.
3. Verify form fields are not editable while loading.

## Empty State Tests

### No Error Initially

1. Render `AuthPage` without `errorMessage`.
2. Verify no error message is displayed.

### Optional Account Notice

1. Render `AuthPage`.
2. Verify the notice text "No account needed" (or similar) is visible, communicating the app works without signing up.

## Component Interaction Tests

### AuthPage Tab State

1. Render with `activeTab: "register"`.
2. Verify the "Register" tab is visually active and the registration form is shown.

### Form Reset on Tab Switch

1. Enter data in the login form.
2. Switch to the "Register" tab.
3. Switch back to "Sign in".
4. Verify form fields are empty or retain previous values (based on implementation choice).

## Edge Cases

- Very long email address (200+ characters).
- Password with special characters and Unicode.
- Rapid tab switching between Sign in and Register.
- Double-click on submit button.
- Error message with HTML characters (verify no XSS).

## Accessibility Checks

- Tab toggle is keyboard-navigable with arrow keys.
- Active tab has `aria-selected="true"`.
- Form fields have associated labels.
- Error messages are linked via `aria-describedby`.
- "Sign in" and "Register" buttons are focusable and labeled.
- Google login button has accessible label (e.g. "Continue with Google").
- "Forgot password?" link is focusable.

## Sample Test Data

```typescript
const loginFormData: LoginFormData = {
  email: "user@example.com",
  password: "password123",
};

const registerFormData: RegisterFormData = {
  email: "newuser@example.com",
  password: "securePass1!",
  passwordConfirm: "securePass1!",
};

const authPagePropsLogin: AuthPageProps = {
  activeTab: "login",
  isLoading: false,
  errorMessage: undefined,
  onLogin: jest.fn(),
  onRegister: jest.fn(),
  onGoogleLogin: jest.fn(),
  onForgotPassword: jest.fn(),
};

const authPagePropsError: AuthPageProps = {
  activeTab: "login",
  isLoading: false,
  errorMessage: "Invalid email or password",
  onLogin: jest.fn(),
  onRegister: jest.fn(),
  onGoogleLogin: jest.fn(),
  onForgotPassword: jest.fn(),
};
```
