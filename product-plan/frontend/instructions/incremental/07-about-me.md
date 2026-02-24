# Milestone 7: About Me

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

Implement the About Me page — the personal story of the operator Timo.

## Overview

A personal, narrative page telling the story behind Fahrrad Wetter. Warm tone, no corporate language. Introduces Timo, explains why the app was built, describes the target audience, and invites community participation.

**Key Functionality:**
- Hero with personal introduction
- "The idea" story section
- "Who is this for?" target audience section
- CTA linking to feedback/contact page

## Components Provided

- `AboutMe` — Full about page with all sections

## Props Reference

No callback props — this is a static content page. The CTA links to /contact.

## Done When

- [ ] All content sections render
- [ ] CTA links to contact page
- [ ] Warm, personal tone maintained
- [ ] Responsive and centred (max-width ~640px)
