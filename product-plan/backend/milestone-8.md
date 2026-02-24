# Milestone 8: Contact Form Endpoint

## What

Contact form submits to backend and stores the message in the database.

## Backend files

- `backend/app/schemas/contact.py` — ContactFormSchema (category, name, email, message)
- `backend/app/api/routes/contact.py` — `POST /api/contact` → validate, store in ContactMessage table, return 201

## Frontend files

- New `frontend/src/api/contact.ts` — submitContactForm(data)
- Modify `frontend/src/pages/ContactPage.tsx` — Replace setTimeout mock with submitContactForm() API call

## Implementation guidelines

- **No auth required** — the contact form should be accessible to anonymous users.
- **Input validation**: Validate email format, require non-empty name and message, validate category is one of the allowed values (use a Pydantic enum or Literal type).
- **Message length limit**: Cap message body at a reasonable length (e.g. 5000 chars) to prevent abuse.
- **Timestamps**: Store `created_at` automatically via DB default.
- **No email sending yet** — just store in DB. Email notification can be added later.

## Tests

- `tests/test_api/test_contact.py`:
  - `test_submit_contact_form` — POST /api/contact with valid data returns 201.
  - `test_submit_contact_form_stores_in_db` — After submission, message is found in the ContactMessage table.
  - `test_submit_contact_form_invalid_email_returns_422` — Bad email format returns 422.
  - `test_submit_contact_form_missing_fields_returns_422` — Missing name/email/message returns 422.
  - `test_submit_contact_form_invalid_category_returns_422` — Unknown category value returns 422.
  - `test_submit_contact_form_message_too_long_returns_422` — Message exceeding max length returns 422.

## Verify

- Fill out contact form → submit → success confirmation
- Check database → message stored with category, email, and text
- `pytest` passes all tests (including M1–M7)
