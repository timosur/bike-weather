# Contact & Feedback

## Overview

Contact page with a feedback form. Emphasizes that Fahrrad Wetter is actively being developed and that user feedback is welcome. Low barrier, inviting, personal tone. Centered layout, max-width ~480px.

## User Flows

1. **Fill Form:** User selects a category (Feedback, Bug report, Feature request, Other), optionally enters their name, enters their email (required), and writes a message.
2. **Submit:** User clicks "Send" to submit the form.
3. **Loading State:** While submitting, the "Send" button shows a loading spinner.
4. **Success:** After successful submission, an inline success confirmation is displayed (no page redirect).
5. **Error:** If submission fails, an error message is displayed inline.
6. **Direct Email:** User can alternatively use the direct email address shown on the page.

## Components Provided

### `ContactPage`

The complete contact page component. Renders intro text ("Fahrrad Wetter thrives on your feedback"), the contact form with category selector, name field, email field, message textarea, and submit button. Includes success/error state handling and a personal note.

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onSubmit` | `(data: ContactFormData) => void` | Called when the user submits the contact form. Host should send the message to the backend. |

## Props

| Prop | Type | Description |
|---|---|---|
| `isLoading` | `boolean` | Whether a submit request is in progress (shows loading state on button). |
| `isSuccess` | `boolean` | Whether the form was successfully submitted (shows success confirmation). |
| `errorMessage` | `string` | Error message to display if submission failed. |
