# About Me Tests

## Overview

Test the AboutMe component to verify all content sections render correctly and the CTA link points to the contact page.

## User Flow Tests

### All Sections Render

1. Render `AboutMe`.
2. Verify the hero section displays the name "Timo" and an introductory text.
3. Verify "The Story" section is present with motivation text.
4. Verify "Who is this for?" section is present with target audience description (beginners, casual riders, bikepackers).
5. Verify the "Get Involved" section is present with feedback invitation text.

### CTA Links to Contact

1. Render `AboutMe`.
2. Find the call-to-action link in the "Get Involved" section.
3. Verify the link points to `/contact`.
4. Verify the link text invites the user to provide feedback.

## Empty State Tests

Not applicable. This is a static content page with no dynamic data.

## Component Interaction Tests

### Static Content

1. Render `AboutMe`.
2. Verify no props are required (component renders without any props).
3. Verify no callbacks are triggered on render.

## Edge Cases

- Render in a very narrow viewport (320px) -- verify text wraps properly.
- Render in dark mode -- verify all text is readable.

## Accessibility Checks

- Heading hierarchy is correct (h1 for page title, h2 for section headings).
- All text has sufficient color contrast in both light and dark mode.
- CTA link is focusable and has descriptive text.
- Page content is structured with semantic HTML (sections, headings, paragraphs).
- Content is readable at 200% zoom.

## Sample Test Data

No sample data needed. This component has no props.
