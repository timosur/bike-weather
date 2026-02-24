# Milestone 8: FAQ

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

Implement the FAQ page — an accordion-style list of frequently asked questions grouped by category.

## Overview

Users browse categorised questions and expand answers via accordion. A CTA at the bottom links to the contact page for unlisted questions. Serves double duty as SEO content.

**Key Functionality:**
- Accordion with expand/collapse per question
- Questions grouped by category (General, Weather data, Recommendations, Technical)
- "Question not listed?" CTA linking to contact page

## Components Provided

- `FaqPage` — Full FAQ page with accordion and CTA

## Props Reference

- `items: FaqItem[]` — Array of FAQ items with id, question, answer, category

## Done When

- [ ] Accordion expand/collapse works
- [ ] Questions grouped by category
- [ ] CTA links to contact page
- [ ] Smooth animations
- [ ] Responsive and centred
