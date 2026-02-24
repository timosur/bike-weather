# Privacy Policy

## Overview

GDPR-compliant privacy policy page. Describes what data is collected (location, usage data), legal bases, cookies, Google Analytics/Ads, third-party providers (weather API, Google Login), and user rights. Structured text page with table of contents anchor links.

## User Flows

1. **Navigate:** User navigates to the privacy policy via the footer link.
2. **Table of Contents:** User clicks TOC links to jump directly to specific sections.
3. **Read Sections:** User reads through all privacy-related information.
4. **Contact:** User finds a contact option for privacy-related enquiries.

## Components Provided

### `PrivacyPolicy`

The complete privacy policy page component. Renders a structured text page with heading, table of contents with anchor links, and multiple content sections. Centered layout, max-width ~640px.

## Props

None. This is a static content page. All text content is embedded in the component.

## Callback Props

None. Navigation is handled via standard anchor links within the page.

## Content Sections

1. **Controller** -- Responsible party information
2. **Data Collected** -- Location data, usage data, account data
3. **Legal Bases** -- GDPR articles and justifications
4. **Cookies & Tracking** -- Google Analytics, Google Ads, cookie consent
5. **Third-Party Providers** -- Weather API, Google Login
6. **User Rights** -- Right to access, deletion, portability, etc.
7. **Contact** -- Contact information for privacy enquiries
