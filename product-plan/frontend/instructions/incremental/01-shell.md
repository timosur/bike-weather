# Milestone 1: Shell

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

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

Set up the design tokens and application shell — the persistent chrome that wraps all sections.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

### 2. Application Shell

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper with header, footer, and content area
- `MainNav.tsx` — Navigation component with responsive mobile menu
- `UserMenu.tsx` — User menu with avatar dropdown

**Wire Up Navigation:**

Connect navigation to your routing:

| Label | Path | Notes |
|-------|------|-------|
| Planner | `/planner` | Default on load |
| Ride Report | `/report` | |
| Products | `/products` | |
| My Routes | `/routes` | Only visible when logged in |
| About Me | `/about-me` | |

**Footer Sections:**

| Section | Links |
|---------|-------|
| Product | Ride Planner → /planner, FAQ → /faq, About Me → /about-me |
| Contact | Give Feedback → /contact, Sign In → /login |
| Legal | Imprint → /imprint, Privacy Policy → /privacy-policy |

**User Menu:**

The user menu expects:
- User name
- Avatar URL (optional, falls back to initials)
- Logout callback

**Language Toggle:**

DE ↔ EN text button always visible in the header.

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts)
- [ ] Shell renders with navigation header and footer
- [ ] Navigation links to correct routes
- [ ] Active nav item shows emerald highlight
- [ ] User menu shows user info (when logged in)
- [ ] Language toggle works
- [ ] Responsive on mobile (hamburger menu)
- [ ] Dark mode supported
