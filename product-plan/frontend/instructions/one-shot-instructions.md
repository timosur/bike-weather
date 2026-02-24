# Fahrrad Wetter -- One-Shot Implementation Instructions

## Product Summary

Fahrrad Wetter is a free web app that gives cyclists personalized clothing and gear recommendations for their planned ride, based on real weather data. Users enter their location, riding style, and tour details -- the app tells them exactly what to wear and pack. It supports single-day rides and multi-day tours, with day-by-day breakdowns.

The app is bilingual (German/English), ad-supported, and optionally allows user accounts for saved routes. Affiliate product links are integrated for revenue.

---

## Milestone 1: Application Shell

### Goal

Implement the persistent header and footer chrome that wraps all page content.

### Requirements

- **Header:** 56px fixed height, max-width 1200px centered container. Logo and "Fahrrad Wetter" brand text on the left. Navigation links (Planner, Ride Report, Products, My Routes, About Me) center-right. Language toggle (DE/EN) and user menu on the far right.
- **Footer:** Brand column (logo, tagline), three link columns (Product, Contact, Legal), and a bottom bar with copyright and legal links. Same max-width container.
- **Active nav:** Emerald-600/emerald-400 text with emerald-50/emerald-900 pill background and small emerald dot indicator below.
- **Responsive:** Desktop shows full horizontal nav. Mobile hides nav behind hamburger icon with slide-down menu. Footer adapts from 4 columns to 2 on mobile.
- **Dark mode:** Fully supported with explicit dark variants for all colors.
- **User menu:** Only visible when logged in. Avatar or initials with dropdown (account settings, logout).
- **Conditional nav:** "My Routes" link only visible when logged in.

### Components

- `AppShell` -- Top-level wrapper with header, content slot, footer
- `MainNav` -- Desktop navigation with active state
- `UserMenu` -- Avatar dropdown

### Routes

| Path | Section |
|---|---|
| `/planner` | Ride Planner (default) |
| `/report` | Ride Report |
| `/products` | Product Recommendations |
| `/routes` | My Routes (auth required) |
| `/about-me` | About Me |
| `/login` | Login & Registration |
| `/faq` | FAQ |
| `/contact` | Contact & Feedback |
| `/imprint` | Imprint |
| `/privacy-policy` | Privacy Policy |

### Data Shapes

See `data-shapes/overview.ts` for all TypeScript interfaces.

---

## Milestone 2: Ride Planner

### Goal

Build the primary entry point where users configure their ride and submit to get weather-based recommendations.

### Requirements

- Address field with autocomplete suggestions dropdown and "Use current location" GPS button.
- Date picker for start date and time input (side by side on desktop).
- Bike type selector: Road, Gravel, MTB, City (segmented control or card toggle).
- Riding intensity segmented control: Easy, Moderate, Sporty with brief descriptions.
- Collapsible "Advanced Options" section with optional distance (km) and elevation (meters) inputs.
- Multi-day toggle with overnight stop list: each stop has location field, planned km, remove button. "Add stop" button. End date auto-calculated.
- Quick presets as shortcut buttons above the form.
- "Get weather" submit button with loading state.
- Inline validation for required fields.
- Centered form, max-width ~480px.

### Components

- `RidePlanner` -- Main form
- `LocationPicker` -- Location input with autocomplete + GPS
- `DayLocationList` -- Multi-day overnight stops

### Callbacks

- `onLocationSearch(query)` -- Fetch autocomplete suggestions
- `onUseCurrentLocation()` -- Trigger GPS geolocation
- `onLocationSelect(suggestion)` -- User selected a suggestion
- `onDayStopLocationSearch(stopIndex, query)` -- Fetch suggestions for day stop
- `onPresetSelect(preset)` -- Apply a quick preset
- `onSubmit(input)` -- Form submitted with valid data; navigate to Ride Report

### Key Data Shapes

`RideInput`, `LocationSuggestion`, `BikeTypeOption`, `RidingIntensityOption`, `QuickPreset`, `ValidationErrors`

---

## Milestone 3: Ride Report

### Goal

Display detailed weather summary, personalized clothing recommendations as individual cards, and equipment checklist. Support multi-day tabs and inline product links.

### Requirements

- Color-coded condition label: green (Ideal), yellow (Good), orange (Caution), red (Not Recommended).
- Weather section: temperature (min/max + feels like), precipitation, wind, humidity, UV index, sunrise/sunset with icons.
- Clothing recommendations as card grid: icon, name, reason. Cards with alternatives show swap button; swapping replaces the current item.
- Inline product tip below clothing cards (optional, when `products` prop provided): image, name, price, "Ad" badge.
- Static equipment checklist (no interactive checkboxes).
- Multi-day tab navigation: each tab shows date, weather icon, and location name.
- Share button (copy link / social) and Save Route button in header.
- Mobile-first, responsive for desktop.
- Product sections backward-compatible (only shown when `products` prop is present).

### Components

- `RideReport` -- Top-level report
- `DayTabs` -- Multi-day navigation
- `WeatherPanel` -- Weather data display
- `ClothingItemCard` -- Individual clothing card with swap
- `EquipmentList` -- Static equipment checklist
- `ConditionBadge` -- Color-coded rating badge
- `WeatherIcon` -- Weather condition icon

### Callbacks

- `onShare()` -- Share report
- `onSaveRoute()` -- Save route to My Routes
- `onDaySelect(dayId)` -- Switch day tab
- `onSwapClothingItem(dayId, itemId, alternativeId)` -- Swap clothing item
- `onProductClick(productId)` -- Open affiliate link

### Key Data Shapes

`RideReport`, `DayForecast`, `WeatherData`, `ClothingItem`, `ClothingAlternative`, `EquipmentItem`, `ConditionRating`

---

## Milestone 4: Product Recommendations

### Goal

Implement the affiliate product system with inline links in the Ride Report, a collected products section, and a standalone category browsing page.

### Requirements

- Inline product cards in Ride Report: product image, name, price, shop icon, "Ad" badge.
- Collected product section below report: card grid grouped by category with affiliate disclosure.
- Standalone Products page: category card grid with icons and titles.
- Category detail view: product cards with image, name, price, shop name, affiliate link button.
- All external links open in new tab (`target="_blank"`).
- "Ad" badge (e.g. "Anzeige") visible on every product card. Full disclaimer text below product sections.
- Mobile-first, responsive for desktop.

### Components

- `ProductCategories` -- Category overview page
- `ProductCategoryDetail` -- Category detail with products
- `ProductCard` -- Individual product card
- `ReportProducts` -- Collected products below Ride Report
- `InlineProductLink` -- Compact product link in Ride Report
- `CategoryIcon` -- Category icon

### Callbacks

- `onProductClick(productId)` -- Open affiliate URL
- `onCategorySelect(categoryId)` -- Navigate to category detail
- `onBack()` -- Return to category overview

### Key Data Shapes

`Product`, `ProductCategory`, `Shop`, `AffiliateDisclosure`, `WeatherSuitability`, `TempRange`

---

## Milestone 5: My Routes

### Goal

Build the saved routes overview for logged-in users with CRUD operations and empty state.

### Requirements

- Card-based layout: route name, start location, distance, riding style, color-coded condition badge.
- Responsive grid: 1 col mobile, 2 from `sm:`, 3 from `lg:`.
- Three-dot menu on each card with "Edit" and "Delete" actions.
- Edit opens modal with editable fields (name, start location, distance, riding style).
- Delete shows confirmation dialog ("Really delete this route?") with "Cancel" and "Delete".
- Empty state: "No routes saved yet" text with "Plan First Route" CTA button.
- Page heading "My Routes" with route count badge.

### Components

- `MyRoutes` -- Route list page
- `RouteCard` -- Individual route card
- `EditRouteModal` -- Edit modal
- `DeleteConfirmDialog` -- Delete confirmation
- `EmptyRoutes` -- Empty state

### Callbacks

- `onRouteSelect(routeId)` -- Fetch fresh Ride Report
- `onRouteEdit(routeId, updates)` -- Save route edits
- `onRouteDelete(routeId)` -- Delete route
- `onNavigateToPlanner()` -- Navigate to Ride Planner from empty state

### Key Data Shapes

`SavedRoute`, `RidingStyle`, `ConditionRating`

---

## Milestone 6: Login & Registration

### Goal

Implement the authentication page with email/password login, registration, and Google login.

### Requirements

- Centered card, max-width ~400px.
- Tab toggle: "Sign in" / "Register".
- Login form: email, password, "Sign in" button.
- Registration form: email, password, confirm password, "Register" button.
- Divider with "or".
- Google login button with Google icon.
- "Forgot password?" link below login form.
- Notice: "No account needed -- you can use Fahrrad Wetter without signing up."
- Inline validation: email format, password length (min 8), matching passwords.
- Loading state on buttons.
- Error message display inline.

### Components

- `AuthPage` -- Complete auth page

### Callbacks

- `onLogin(data)` -- Submit login
- `onRegister(data)` -- Submit registration
- `onGoogleLogin()` -- Start OAuth
- `onForgotPassword()` -- Navigate to reset flow

### Key Data Shapes

`AuthTab`, `LoginFormData`, `RegisterFormData`

---

## Milestone 7: FAQ

### Goal

Build the FAQ page with categorized accordion questions and a contact CTA.

### Requirements

- Heading and intro text.
- Accordion list grouped by category: General, Weather data, Recommendations, Account, Technical.
- Only one accordion item open at a time.
- Smooth open/close animation.
- "Question not listed?" hint at bottom with link to `/contact`.
- Centered, max-width ~640px.

### Components

- `FaqPage`

### Props

- `items: FaqItem[]`

### Key Data Shapes

`FaqItem`

---

## Milestone 8: Contact & Feedback

### Goal

Build the contact form with category selection, validation, and success/error states.

### Requirements

- Intro text: "Fahrrad Wetter thrives on your feedback."
- Form: category selector (Feedback, Bug report, Feature request, Other), name (optional), email (required), message (textarea), "Send" button.
- Loading state on submit button.
- Inline success confirmation after submitting (no redirect).
- Error message display inline.
- Direct email address as alternative.
- Personal note: "I read every message and reply as soon as possible."
- Centered, max-width ~480px.

### Components

- `ContactPage`

### Callbacks

- `onSubmit(data)` -- Send contact form

### Key Data Shapes

`ContactCategory`, `ContactFormData`

---

## Milestone 9: About Me

### Goal

Build the static personal page about the operator.

### Requirements

- Personal hero with name "Timo" and introduction.
- "The Story" section: motivation and problem.
- "Who is this for?" section: target audience.
- "Get Involved" section with feedback CTA linking to `/contact`.
- Personal, informal tone.
- Centered, max-width ~640px.

### Components

- `AboutMe` -- Static content page, no props or callbacks

---

## Milestone 10: Imprint

### Goal

Build the legally required imprint page.

### Requirements

- Sections: Information according to SS 5 TMG, Contact, Liability Disclaimer, Copyright.
- Placeholder values for name, address, email.
- Plain, readable layout.
- Centered, max-width ~640px.

### Components

- `Imprint` -- Static content page, no props or callbacks

---

## Milestone 11: Privacy Policy

### Goal

Build the GDPR-compliant privacy policy page.

### Requirements

- Sections: Controller, Data Collected, Legal Bases, Cookies & Tracking, Third-Party Providers, User Rights, Contact.
- Table of contents with anchor links for scrolling to sections.
- Centered, max-width ~640px.

### Components

- `PrivacyPolicy` -- Static content page, no props or callbacks

---

## Design System

### Colors

Use the product's design tokens if defined. Defaults:
- **Primary accent:** Emerald (emerald-500/600 for actions, active states)
- **Neutrals:** Stone palette (warm grays)
- **Condition colors:** Green (ideal), Yellow (good), Orange (caution), Red (not-recommended)

### Typography

Use the product's font tokens if defined. Otherwise use system defaults or a clean sans-serif.

### General

- Mobile-first, responsive with Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- Light and dark mode with `dark:` variants
- Tailwind CSS v4 (no tailwind.config.js)
- Built-in Tailwind utility classes only, no custom CSS
- Built-in Tailwind colors only

---

## Implementation Notes

- All components are props-based. They receive data and callbacks via props -- never import data directly.
- Section screen designs do NOT include navigation chrome. The shell handles all navigation.
- The implementation agent should decide backend architecture, data storage, API design, and business logic. These instructions focus on the UI layer.
- See `data-shapes/overview.ts` for all TypeScript interfaces.
- See `sections/[section-id]/tests.md` for UI behavior test specs per section.
- See `sections/[section-id]/README.md` for component documentation per section.
- External affiliate links always open in new tab with `target="_blank" rel="noopener noreferrer"`.
- "Ad" badge must be visible on all affiliate product displays (German advertising law compliance).
