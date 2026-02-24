# Privacy Policy Tests

## Overview

Test the PrivacyPolicy component to verify all required sections render, the table of contents links scroll to the correct sections, and content is readable.

## User Flow Tests

### All Sections Render

1. Render `PrivacyPolicy`.
2. Verify the page heading "Privacy Policy" (or "Datenschutzerklarung") is displayed.
3. Verify the following sections are present:
   - Controller
   - Data Collected
   - Legal Bases
   - Cookies & Tracking
   - Third-Party Providers
   - User Rights
   - Contact

### TOC Links Scroll to Sections

1. Render `PrivacyPolicy`.
2. Verify a table of contents is displayed at the top of the page.
3. Click the "Data Collected" link in the TOC.
4. Verify the page scrolls to the "Data Collected" section.
5. Click the "User Rights" link in the TOC.
6. Verify the page scrolls to the "User Rights" section.

### Content Completeness

1. Render `PrivacyPolicy`.
2. Verify the "Data Collected" section mentions location data.
3. Verify the "Cookies & Tracking" section mentions Google Analytics or Google Ads.
4. Verify the "Third-Party Providers" section mentions weather API and Google Login.
5. Verify the "User Rights" section mentions right to access, deletion, and data portability.

## Empty State Tests

Not applicable. This is a static content page.

## Component Interaction Tests

### TOC Anchor Links

1. Verify each TOC link has an `href` matching a section `id` on the page.
2. Verify clicking a TOC link does not reload the page (smooth scroll or hash navigation).

## Edge Cases

- Very long section content -- verify it does not break layout.
- Render at narrow viewport (320px) -- verify text wraps and TOC is usable.
- Render in dark mode -- verify all text sections are readable.

## Accessibility Checks

- Heading hierarchy is correct (h1 for page title, h2 for section headings).
- TOC links have descriptive text matching section headings.
- All text has sufficient color contrast.
- Page is navigable via keyboard (Tab through TOC links, Enter to activate).
- Section IDs are unique and properly linked from TOC.
- Content is structured with semantic HTML.

## Sample Test Data

No sample data needed. This component has no props.
