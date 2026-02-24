# Milestone 10: Imprint

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

Implement the Imprint page — legally required provider identification.

## Overview

A plain text page with legal information structured in sections: information per 5 TMG, contact details, liability disclaimers, and copyright notices. Placeholders for personal data that the operator fills in.

**Key Functionality:**
- Structured legal text sections
- Placeholder data for operator details

## Components Provided

- `Imprint` — Full imprint page

## Done When

- [ ] All legal sections render
- [ ] Placeholder data clearly marked
- [ ] Clean, readable layout
- [ ] Responsive and centred
