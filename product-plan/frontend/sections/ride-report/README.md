# Ride Report

## Overview

The Ride Report displays detailed weather data, personalized clothing recommendations, and equipment checklists for a planned ride. For multi-day tours the view is broken down day-by-day via tabs. A color-coded condition rating provides quick assessment of riding conditions. Inline affiliate product links can appear alongside clothing recommendations.

## User Flows

1. **View Report:** User arrives from the Ride Planner and immediately sees the report for the first day.
2. **Condition Rating:** User sees a prominent color-coded label (Ideal, Good, Caution, Not Recommended) summarizing overall conditions.
3. **Weather Data:** User sees temperature (min/max + feels like), precipitation, wind, humidity, UV index, sunrise/sunset.
4. **Clothing Recommendations:** User sees individual clothing item cards with icon, name, and explanation of why the item is recommended.
5. **Swap Alternatives:** Each clothing card may have alternatives (e.g. leg warmers vs long tights). User clicks the swap button to replace the current item.
6. **Inline Product Tips:** Below each clothing card, an optional affiliate product link appears (image, name, price, "Ad" badge).
7. **Equipment Checklist:** User sees a static list of recommended equipment items with reasons.
8. **Multi-Day Navigation:** For multi-day tours, user switches between days via tabs showing date, weather icon, and location name.
9. **Share:** User clicks the share button to copy a link or share via social media.
10. **Save Route:** User clicks "Save Route" to store the route in My Routes.

## Components Provided

### `RideReport`

The top-level report component. Renders the complete ride report including header, day tabs, weather panel, clothing cards, equipment list, and action buttons.

### `DayTabs`

Tab navigation for multi-day tours. Each tab shows the date, a weather icon, and the location name.

### `WeatherPanel`

Displays weather data for the selected day: temperature, precipitation, wind, humidity, UV index, sunrise/sunset. Uses icon-based layout.

### `ClothingItemCard`

Individual clothing recommendation card. Shows an icon, clothing name, reason text, and optional swap button for alternatives. Can include an inline product link below.

### `EquipmentList`

Static checklist of recommended equipment items with reasons. Visually styled as a checklist but without interactive checkboxes.

### `ConditionBadge`

Color-coded badge for the overall condition rating. Green = Ideal, Yellow = Good, Orange = Caution, Red = Not Recommended.

### `WeatherIcon`

Renders a weather condition icon (sun, cloud-sun, cloud, rain, snow, thunderstorm, fog).

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onShare` | `() => void` | Called when the user clicks the share button. Host should copy the share URL or open a share dialog. |
| `onSaveRoute` | `() => void` | Called when the user clicks "Save Route". Host should persist the route to the user's saved routes. |
| `onDaySelect` | `(dayId: string) => void` | Called when the user selects a different day tab. |
| `onSwapClothingItem` | `(dayId: string, itemId: string, alternativeId: string) => void` | Called when the user swaps a clothing item for an alternative. |
| `onProductClick` | `(productId: string) => void` | Called when the user clicks an affiliate product link. Host should open the affiliate URL in a new tab. |

## Data Dependencies

- `report: RideReport` -- The full report object with days, weather, clothing, equipment
- `products?: Product[]` -- Available affiliate products for inline display
- `shops?: Shop[]` -- Shop metadata for product cards
- `disclosure?: AffiliateDisclosure` -- Advertising disclosure label and disclaimer text
