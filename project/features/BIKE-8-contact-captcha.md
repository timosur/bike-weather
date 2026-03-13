# BIKE-8: Contact & Captcha

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-8     |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Contact/feedback form with Cloudflare Turnstile captcha integration. Turnstile is also used on registration and optionally after a throttle threshold on the ride planner.

## Scope

Sub-features and areas covered:

- Contact/feedback form with name, email, category, and message fields
- Cloudflare Turnstile captcha on the contact form
- Turnstile on registration form
- Optional Turnstile verification on ride planner after throttle threshold
- Backend Turnstile token verification service
- Contact messages stored in database for admin review
- Rate limiting on contact endpoint (5/min)

### Key Files

- `backend/app/api/routes/contact.py` — POST /api/contact endpoint
- `backend/app/services/turnstile.py` — Cloudflare Turnstile verification service
- `backend/app/models/contact_message.py` — ContactMessage model
- `frontend/src/pages/ContactPage.tsx` — contact form page
- `frontend/src/components/contact/` — contact form components
- `frontend/src/api/contact.ts` — API client for contact

## Acceptance Criteria (Summary)

- Contact form submits with name, email, category, and message
- Turnstile captcha must be completed before submission
- Backend verifies Turnstile token with Cloudflare API
- Submitted messages are stored for admin review
- Contact endpoint is rate-limited to 5/min
- Registration form includes Turnstile verification

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
