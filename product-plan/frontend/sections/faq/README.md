# FAQ

## Overview

Frequently asked questions about Fahrrad Wetter. Explains how the app works, where weather data comes from, how recommendations are calculated, and answers typical user questions. Organized by category with an accordion interface. Serves as both user help and SEO content.

## User Flows

1. **Browse Questions:** User navigates to the FAQ page and sees questions grouped by category (General, Weather data, Recommendations, Account, Technical).
2. **Expand Answer:** User clicks a question to expand the accordion and read the answer. Only one item is open at a time.
3. **Contact Link:** User scrolls to the bottom and finds a "Question not listed?" hint with a link to the contact page.

## Components Provided

### `FaqPage`

The complete FAQ page component. Renders a heading, intro text, categorized accordion list of questions and answers, and a CTA link to the contact page. Centered layout, max-width ~640px.

## Props

| Prop | Type | Description |
|---|---|---|
| `items` | `FaqItem[]` | Array of FAQ items with id, question, answer, and category. |

## Callback Props

None. The FAQ page is read-only with no interactive callbacks beyond internal accordion state.
