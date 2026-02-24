# FAQ Tests

## Overview

Test the FaqPage component including accordion open/close behavior, category grouping, CTA link to the contact page, and content rendering.

## User Flow Tests

### Accordion Open

1. Render `FaqPage` with 5 FAQ items across 2 categories.
2. Verify all questions are visible with collapsed answers.
3. Click the first question "What is Fahrrad Wetter?".
4. Verify the answer expands and is visible.

### Accordion Close (Only One Open at a Time)

1. Click the first question to open it.
2. Verify the first answer is visible.
3. Click the second question "Is Fahrrad Wetter free?".
4. Verify the second answer expands and is visible.
5. Verify the first answer collapses and is no longer visible.

### Accordion Toggle

1. Click a question to open it.
2. Click the same question again.
3. Verify the answer collapses.

### Category Grouping

1. Render `FaqPage` with items in categories: "General", "Weather data", "Recommendations".
2. Verify items are grouped under category headings.
3. Verify "General" items appear before "Weather data" items.

### CTA Link to Contact Page

1. Scroll to the bottom of the FAQ page.
2. Verify the text "Question not listed?" (or similar hint) is displayed.
3. Verify a link to the contact page (`/contact`) is present.
4. Verify the link is clickable.

## Empty State Tests

### No FAQ Items

1. Render `FaqPage` with `items: []`.
2. Verify a fallback message or empty state is displayed.
3. Verify the CTA link to contact is still shown.

## Component Interaction Tests

### Smooth Animation

1. Open a question.
2. Verify the answer expands with a smooth animation (not abrupt show/hide).
3. Close the question.
4. Verify the answer collapses with a smooth animation.

### All Questions Visible

1. Render with 10+ FAQ items.
2. Verify all question titles are visible without scrolling the accordion content itself (page scrolls, not the component).

## Edge Cases

- FAQ item with very long answer text (500+ words).
- FAQ item with HTML entities or special characters in the answer.
- All items in the same category.
- Single FAQ item.

## Accessibility Checks

- Each question button has `aria-expanded` set to `true` when open and `false` when closed.
- Answer content is associated with the question via `aria-controls`.
- Questions are focusable and togglable via Enter or Space.
- Category headings use appropriate heading levels.
- The CTA link has descriptive text.

## Sample Test Data

```typescript
const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is Fahrrad Wetter?",
    answer:
      "Free web app for weather-based clothing recommendations for cyclists. Enter your location, riding style, and tour details — the app tells you exactly what to wear and pack.",
    category: "General",
  },
  {
    id: "faq-2",
    question: "Is Fahrrad Wetter free?",
    answer:
      "Yes, completely free. The app is funded through advertising and affiliate links.",
    category: "General",
  },
  {
    id: "faq-3",
    question: "Do I need an account?",
    answer:
      "No. The core feature (weather lookup + recommendation) works without signing up. An account enables saved routes.",
    category: "General",
  },
  {
    id: "faq-4",
    question: "Where does the weather data come from?",
    answer:
      "From professional weather services via standardised APIs. Data is fetched in real time.",
    category: "Weather data",
  },
  {
    id: "faq-5",
    question: "How are the clothing recommendations calculated?",
    answer:
      "From the combination of temperature, wind, precipitation, bike type, and intensity. Each factor affects how warm or cold you feel on the bike.",
    category: "Recommendations",
  },
  {
    id: "faq-6",
    question: "Why does the app ask for my location?",
    answer:
      "To fetch weather data for your exact start location. You can also enter an address manually.",
    category: "Technical",
  },
];
```
