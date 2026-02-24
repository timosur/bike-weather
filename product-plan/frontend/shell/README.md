# Application Shell

## Overview

The Fahrrad Wetter application shell provides the persistent header and footer chrome that wraps all section content. It uses a minimal, content-focused layout with a slim top bar and a structured multi-column footer.

## Header

- **Height:** 56px fixed
- **Max-width:** 1200px centered container
- **Left:** Logo and "Fahrrad Wetter" brand text
- **Center-right:** Navigation links (Planner, Ride Report, Products, My Routes, About Me)
- **Far right:** Language toggle (DE / EN) and user menu (avatar + dropdown, visible only when logged in)

### Active Navigation State

- Emerald-600 (light) / emerald-400 (dark) text color
- Emerald-50 (light) / emerald-900 (dark) pill background
- Small emerald dot indicator below the active item

### Hover State

- Stone-50 (light) / stone-800 (dark) background
- Stone-900 (light) / stone-100 (dark) text

## Footer

The footer appears at the bottom of every page and uses the same 1200px max-width container.

### Columns

1. **Brand Column** -- Logo, "Fahrrad Wetter" name, tagline: "Weather-based clothing recommendations for cyclists."
2. **Product** -- Ride Planner, FAQ, About Me
3. **Contact** -- Give Feedback, Sign In
4. **Legal** -- Imprint, Privacy Policy

### Bottom Bar

- Copyright line: "(c) [year] Fahrrad Wetter. A project by Timo."
- Direct links to Imprint and Privacy Policy

## Responsive Behavior

- **Desktop (md+):** Full horizontal nav links visible. Footer columns in a 4-column grid.
- **Tablet:** Same as desktop with slightly compressed links. Footer in 3 columns.
- **Mobile:** Nav links hidden; hamburger icon opens a slide-down menu with vertical nav links, language toggle, and logout option. Footer stacks in 2 columns.

## Dark Mode

Fully supported. Header background switches to stone-900 with subtle bottom border. Footer uses the same approach. All text and accent colors have explicit dark variants.

## Components

- `AppShell` -- Top-level wrapper rendering header, main content slot, and footer
- `MainNav` -- Desktop navigation links with active state highlighting
- `UserMenu` -- Avatar/initials dropdown with account settings and logout

## User Menu

Only visible when the user is logged in. Displays the user's avatar (or initials as fallback) with a dropdown containing account settings and a logout action.

## Language Toggle

Always visible as a small text button (DE / EN) in the header. Switches the interface language between German and English.
