# Imprint Tests

## Overview

Test the Imprint component to verify all legally required sections render and placeholder data is visible.

## User Flow Tests

### All Sections Render

1. Render `Imprint`.
2. Verify the page heading "Imprint" (or "Impressum") is displayed.
3. Verify the following sections are present:
   - Information according to SS 5 TMG
   - Contact
   - Liability Disclaimer
   - Copyright

### Placeholder Data Visible

1. Render `Imprint`.
2. Verify the "Information according to SS 5 TMG" section contains placeholder text for name (e.g. "[Name]" or "Timo").
3. Verify the section contains a placeholder address (e.g. "[Street, City]").
4. Verify the "Contact" section contains placeholder email (e.g. "[email@example.com]").

### Liability Disclaimer Content

1. Render `Imprint`.
2. Verify the "Liability Disclaimer" section contains text about liability for content.
3. Verify the section contains text about liability for external links.

### Copyright Notice

1. Render `Imprint`.
2. Verify a copyright notice is displayed (e.g. "(c) [year] Fahrrad Wetter").

## Empty State Tests

Not applicable. This is a static content page.

## Component Interaction Tests

### Static Rendering

1. Render `Imprint`.
2. Verify no props are required.
3. Verify no callbacks are triggered.

## Edge Cases

- Render at narrow viewport (320px) -- verify text wraps properly.
- Render in dark mode -- verify all text is readable.

## Accessibility Checks

- Heading hierarchy is correct (h1 for page title, h2 for section headings).
- All text has sufficient color contrast in both light and dark mode.
- Page is structured with semantic HTML (sections, headings, paragraphs).
- Content is readable at 200% zoom.

## Sample Test Data

No sample data needed. This component has no props.
