# Milestone 9: Contact

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

Implement the Contact page — a feedback form for bug reports, feature requests, and general feedback.

## Overview

A simple contact form with category selection, name, email, and message fields. Shows inline success confirmation after submission. Emphasises that user feedback is valued.

**Key Functionality:**
- Category selector (Feedback, Bug report, Feature request, Other)
- Name (optional), Email (required), Message fields
- Submit with loading state
- Inline success confirmation

## Components Provided

- `ContactPage` — Full contact form with success state

## Props Reference

| Callback | Triggered When |
|----------|---------------|
| `onSubmit` | User submits the contact form |

## Done When

- [ ] Form renders with all fields
- [ ] Category selector works
- [ ] Email validation
- [ ] Submit triggers callback with form data
- [ ] Success state displays after submission
- [ ] Loading state on submit button
- [ ] Responsive and centred
