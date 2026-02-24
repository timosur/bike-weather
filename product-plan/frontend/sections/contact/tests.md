# Contact & Feedback Tests

## Overview

Test the ContactPage component including form submission, required field validation, category selection, success state, loading state, and error display.

## User Flow Tests

### Form Submission (Success)

1. Render `ContactPage` with `onSubmit` handler.
2. Select "Feedback" from the category dropdown.
3. Enter "Test User" in the name field (optional).
4. Enter "user@example.com" in the email field.
5. Enter "Great app, love the recommendations!" in the message textarea.
6. Click the "Send" button.
7. Verify `onSubmit` is called with `{ category: "feedback", name: "Test User", email: "user@example.com", message: "Great app, love the recommendations!" }`.

### Required Email Validation

1. Leave the email field empty.
2. Fill in a message.
3. Click the "Send" button.
4. Verify an inline validation error appears (e.g. "Email is required").
5. Verify the form is NOT submitted (`onSubmit` not called).

### Invalid Email Validation

1. Enter "not-an-email" in the email field.
2. Click the "Send" button.
3. Verify an inline validation error appears (e.g. "Please enter a valid email address").

### Category Selection

1. Render `ContactPage`.
2. Verify the category dropdown contains options: "Feedback", "Bug report", "Feature request", "Other" (or German equivalents).
3. Select "Bug report".
4. Fill in remaining fields and submit.
5. Verify `onSubmit` is called with `category: "bug"`.

### Success State After Submit

1. Render `ContactPage` with `isSuccess: true`.
2. Verify a success confirmation message is displayed inline (e.g. "Thank you for your message!").
3. Verify the form fields are hidden or replaced by the success message.

### Loading State on Button

1. Render `ContactPage` with `isLoading: true`.
2. Verify the "Send" button shows a loading spinner or is disabled.
3. Verify form fields are not editable while loading.

### Error State

1. Render `ContactPage` with `errorMessage: "Failed to send message. Please try again."`.
2. Verify the error message is displayed inline.

### Name is Optional

1. Leave the name field empty.
2. Fill in email and message.
3. Click the "Send" button.
4. Verify the form submits successfully (no validation error on name).

## Empty State Tests

### Initial State

1. Render `ContactPage` without `isSuccess`, `isLoading`, or `errorMessage`.
2. Verify the form is displayed with empty fields.
3. Verify no success or error messages are shown.
4. Verify the "Send" button is enabled.

## Component Interaction Tests

### Intro Text

1. Render `ContactPage`.
2. Verify the intro text "Fahrrad Wetter thrives on your feedback" (or German equivalent) is displayed.

### Personal Note

1. Render `ContactPage`.
2. Verify the personal note "I read every message and reply as soon as possible" (or similar) is displayed.

### Direct Email Alternative

1. Render `ContactPage`.
2. Verify a direct email address is displayed as an alternative contact method.

## Edge Cases

- Very long message (5000+ characters).
- Submitting with only required fields (email + message, no name).
- Special characters in all fields.
- Double-click on "Send" button.
- Switching between success state and form state (resubmit after success).

## Accessibility Checks

- All form fields have associated labels.
- Email validation error is linked via `aria-describedby`.
- Category dropdown is keyboard-navigable.
- "Send" button is focusable and activatable via Enter.
- Success message is announced to screen readers (e.g. via `role="alert"`).
- Error message is announced to screen readers.
- Form fields have appropriate `autocomplete` attributes.

## Sample Test Data

```typescript
const validContactData: ContactFormData = {
  category: "feedback",
  name: "Test User",
  email: "user@example.com",
  message: "Great app, love the weather-based recommendations! Would be nice to also support e-bikes.",
};

const bugReportData: ContactFormData = {
  category: "bug",
  name: "",
  email: "reporter@example.com",
  message: "The location search returns no results when I type an address with umlauts like Munchen.",
};

const contactPagePropsDefault: ContactPageProps = {
  isLoading: false,
  isSuccess: false,
  errorMessage: undefined,
  onSubmit: jest.fn(),
};

const contactPagePropsSuccess: ContactPageProps = {
  isLoading: false,
  isSuccess: true,
  errorMessage: undefined,
  onSubmit: jest.fn(),
};

const contactPagePropsError: ContactPageProps = {
  isLoading: false,
  isSuccess: false,
  errorMessage: "Failed to send message. Please try again.",
  onSubmit: jest.fn(),
};

const contactPagePropsLoading: ContactPageProps = {
  isLoading: true,
  isSuccess: false,
  errorMessage: undefined,
  onSubmit: jest.fn(),
};
```
