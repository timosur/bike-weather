# Milestone 6: Login

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Implement the Login page — authentication for optional accounts with email/password and Google login.

## Overview

A centred authentication card with tab toggle between Sign In and Register. Google login is available as a one-click alternative. The app works without an account — a notice makes this clear.

**Key Functionality:**
- Tab toggle between Sign In and Register
- Email/password login form
- Registration with password confirmation
- Google login button
- Forgot password link
- "No account needed" notice

## Components Provided

- `AuthPage` — Full authentication page with tab toggle and forms

## Props Reference

| Callback | Triggered When |
|----------|---------------|
| `onLogin` | User submits login form |
| `onRegister` | User submits registration form |
| `onGoogleLogin` | User clicks Google login button |
| `onForgotPassword` | User clicks forgot password link |

## Expected User Flows

### Flow 1: Email login

1. User navigates to /login
2. User enters email and password
3. User clicks "Sign in"
4. **Outcome:** User is authenticated and redirected to previous page

### Flow 2: Registration

1. User switches to "Register" tab
2. User enters email, password, confirms password
3. User clicks "Register"
4. **Outcome:** Account created, user logged in

### Flow 3: Google login

1. User clicks "Continue with Google"
2. **Outcome:** Google OAuth flow, user authenticated

## Testing

See `product-plan/sections/login/tests.md`.

## Done When

- [ ] Tab toggle between Sign In and Register
- [ ] Login form validates and submits
- [ ] Registration with password confirmation
- [ ] Google login button triggers OAuth
- [ ] Forgot password link works
- [ ] Inline validation on fields
- [ ] Loading states on buttons
- [ ] "No account needed" notice displayed
