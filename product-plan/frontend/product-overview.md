# Fahrrad Wetter — Product Overview

## Summary

Fahrrad Wetter is a free web app that gives cyclists personalised clothing and gear recommendations for their planned ride, based on real weather data. Users enter their location, riding style, and tour details — the app tells them exactly what to wear and pack.

## Planned Sections

1. **Ride Planner** — The central input area where users specify their starting location, riding style, distance/duration, and optionally an end date for multi-day tours.
2. **Ride Report** — The results page with a weather summary, personalized clothing recommendations, and gear checklist — broken down day by day for multi-day tours.
3. **Product Recommendations** — Curated affiliate product recommendations matched to the current suggestion, e.g. rain jackets, gloves, or bicycle lights.
4. **My Routes** — Optional section for logged-in users: saved routes and riding profiles for quick retrieval without re-entering details.
5. **Login** — Authentication via email/password or Google login. Optional — the app works without an account. Enables saved routes and personal profiles.
6. **About Me** — Personal page of the operator Timo. Tells the story behind Fahrrad Wetter, the motivation, and invites community participation.
7. **FAQ** — Frequently asked questions: how the app works, where weather data comes from, how recommendations are calculated. Also serves as SEO content.
8. **Contact** — Contact form for feedback, feature requests, and bug reports. Emphasises active development and openness to user feedback.
9. **Imprint** — Legally required provider identification pursuant to § 5 TMG.
10. **Privacy Policy** — GDPR-compliant privacy policy with information on collected data, cookies, third-party providers, and user rights.

## Product Entities

- **Ride** — A planned bike ride with all user input parameters (location, style, distance, duration). Forms the basis for all recommendations.
- **WeatherForecast** — Retrieved weather data for a location and time period (temperature, wind, precipitation, feels-like temperature).
- **ClothingRecommendation** — A clothing recommendation for a specific riding day, with layer suggestions and body-zone-specific items.
- **EquipmentItem** — A recommended piece of gear (rain poncho, bike light, puncture repair kit) with a reason.
- **Product** — An affiliate product matching a clothing or equipment category (name, image, price, shop, affiliate link).
- **UserProfile** — Optional user profile with language preference and saved routes.
- **SavedRoute** — A named, saved route configuration for quick reuse of frequently ridden routes.

## Design System

**Colors:**
- Primary: `emerald` — Used for buttons, links, key accents
- Secondary: `amber` — Used for tags, highlights, secondary elements
- Neutral: `stone` — Used for backgrounds, text, borders

**Typography:**
- Heading: Outfit
- Body: Inter
- Mono: IBM Plex Mono

## Implementation Sequence

Build this product in milestones:

1. **Shell** — Set up design tokens and application shell
2. **Ride Planner** — Central input form for ride parameters
3. **Ride Report** — Weather summary and clothing recommendations
4. **Product Recommendations** — Affiliate product cards and category pages
5. **My Routes** — Saved routes for logged-in users
6. **Login** — Authentication (email/password + Google)
7. **About Me** — Personal story page
8. **FAQ** — Frequently asked questions
9. **Contact** — Feedback form
10. **Imprint** — Legal provider identification
11. **Privacy Policy** — GDPR privacy policy

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
