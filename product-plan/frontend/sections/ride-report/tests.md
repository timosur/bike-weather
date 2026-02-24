# Ride Report Tests

## Overview

Test the Ride Report component including day tab navigation, weather display, clothing recommendations with swap alternatives, condition badge colors, equipment list, inline product links, share and save actions, and multi-day vs single-day rendering.

## User Flow Tests

### Single-Day Report Display

1. Render `RideReport` with a report containing one day.
2. Verify no day tabs are shown (single day).
3. Verify the ride name is displayed in the header.
4. Verify the condition badge shows the correct label (e.g. "Ideal").
5. Verify weather data is displayed: temperature, precipitation, wind, humidity, UV index.
6. Verify clothing item cards are rendered with icon, name, and reason text.
7. Verify the equipment list is rendered with item names and reasons.

### Multi-Day Tab Navigation

1. Render `RideReport` with a report containing 3 days.
2. Verify 3 day tabs are visible with date labels and weather icons.
3. Click the second day tab.
4. Verify `onDaySelect` is called with the second day's `id`.
5. Verify weather data updates to reflect the second day.

### Condition Badge Colors

1. Render with `overallCondition: "ideal"`.
2. Verify the badge has a green background and text "Ideal".
3. Render with `overallCondition: "good"`.
4. Verify the badge has a yellow background and text "Good".
5. Render with `overallCondition: "caution"`.
6. Verify the badge has an orange background and text "Caution".
7. Render with `overallCondition: "not-recommended"`.
8. Verify the badge has a red background and text "Not Recommended".

### Clothing Swap

1. Render a clothing item card with alternatives: `[{ id: "alt1", name: "Long Tights", icon: "pants-long" }]`.
2. Verify a swap button/badge is visible on the card.
3. Click the swap button.
4. Select "Long Tights" as the alternative.
5. Verify `onSwapClothingItem` is called with `(dayId, itemId, "alt1")`.

### Share Report

1. Click the "Share" button in the header area.
2. Verify `onShare` is called.

### Save Route

1. Click the "Save Route" button.
2. Verify `onSaveRoute` is called.

### Inline Product Tips

1. Render `RideReport` with `products`, `shops`, and `disclosure` props.
2. Verify inline product links appear below relevant clothing cards.
3. Verify each product link shows the product name, price, and "Ad" badge.
4. Click a product link.
5. Verify `onProductClick` is called with the product's `id`.

### No Products (Backward Compatible)

1. Render `RideReport` without `products` prop.
2. Verify no product links or collected product section is shown.
3. Verify the report otherwise renders normally.

## Empty State Tests

### Clothing Item Without Alternatives

1. Render a `ClothingItemCard` with `alternatives` as `undefined` or `[]`.
2. Verify no swap button is visible on the card.

## Component Interaction Tests

### DayTabs

1. Render `DayTabs` with 3 days.
2. Verify all 3 tabs display date and weather icon.
3. Click each tab and verify the correct `dayId` is emitted.

### WeatherPanel

1. Render `WeatherPanel` with weather data.
2. Verify temperature displays as "Min / Max" with feels-like value.
3. Verify precipitation, wind, humidity, UV index, sunrise, and sunset are shown.

### ConditionBadge

1. Render `ConditionBadge` with each of the four ratings.
2. Verify correct color and label for each.

### EquipmentList

1. Render `EquipmentList` with 3 items.
2. Verify all 3 items are rendered with name and reason.
3. Verify items are styled as a checklist (no interactive checkboxes).

## Edge Cases

- Report with a single day and no clothing items.
- Report with 7+ days (verify tab scrolling or overflow behavior).
- Clothing item with 5+ alternatives.
- Very long ride name (100+ characters).
- Weather data with extreme values (temperature -30, wind 100 km/h).

## Accessibility Checks

- Day tabs are keyboard-navigable with arrow keys.
- Active day tab has `aria-selected="true"`.
- Condition badge has accessible color contrast (not relying on color alone).
- Clothing swap button has an accessible label (e.g. "Swap Leg Warmers for alternative").
- Share and Save buttons are focusable and labeled.

## Sample Test Data

```typescript
const singleDayReport: RideReport = {
  id: "report-1",
  rideName: "Morning Commute Berlin",
  startLocation: "Berlin, Germany",
  ridingStyle: "Moderate",
  totalDistance: 25,
  distanceUnit: "km",
  overallCondition: "ideal",
  shareUrl: "https://fahrradwetter.de/report/report-1",
  days: [
    {
      id: "day-1",
      date: "2026-03-15",
      dayLabel: "Sunday, Mar 15",
      location: "Berlin",
      condition: "ideal",
      weather: {
        tempMin: 8,
        tempMax: 14,
        tempFeelsLike: 10,
        tempUnit: "°C",
        precipitation: 0,
        precipitationUnit: "mm",
        windSpeed: 12,
        windUnit: "km/h",
        windDirection: "SW",
        humidity: 65,
        uvIndex: 4,
        sunrise: "06:45",
        sunset: "18:30",
        icon: "cloud-sun",
        description: "Partly cloudy",
      },
      clothingItems: [
        {
          id: "item-1",
          name: "Short Sleeve Jersey",
          icon: "jersey",
          reason: "Comfortable in 10-14°C with moderate effort",
          alternatives: [
            { id: "alt-1", name: "Long Sleeve Jersey", icon: "jersey-long" },
          ],
        },
        {
          id: "item-2",
          name: "Leg Warmers",
          icon: "leg-warmers",
          reason: "Extra warmth for the morning chill",
          alternatives: [
            { id: "alt-2", name: "Long Tights", icon: "pants-long" },
          ],
        },
        {
          id: "item-3",
          name: "Light Gloves",
          icon: "gloves-light",
          reason: "Protect hands from wind",
        },
      ],
      equipment: [
        { id: "eq-1", name: "Sunglasses", reason: "UV index 4 — protect your eyes" },
        { id: "eq-2", name: "Water Bottle", reason: "Stay hydrated on a 25 km ride" },
      ],
    },
  ],
};

const multiDayReport: RideReport = {
  id: "report-2",
  rideName: "Berlin to Dresden Tour",
  startLocation: "Berlin, Germany",
  ridingStyle: "Touring",
  totalDistance: 200,
  distanceUnit: "km",
  overallCondition: "good",
  shareUrl: "https://fahrradwetter.de/report/report-2",
  days: [
    {
      id: "day-1",
      date: "2026-04-10",
      dayLabel: "Friday, Apr 10",
      location: "Berlin",
      condition: "ideal",
      weather: {
        tempMin: 10,
        tempMax: 18,
        tempFeelsLike: 14,
        tempUnit: "°C",
        precipitation: 0,
        precipitationUnit: "mm",
        windSpeed: 8,
        windUnit: "km/h",
        windDirection: "N",
        humidity: 55,
        uvIndex: 5,
        sunrise: "06:15",
        sunset: "19:45",
        icon: "sun",
        description: "Clear sky",
      },
      clothingItems: [
        { id: "c1", name: "Short Sleeve Jersey", icon: "jersey", reason: "Warm and dry day" },
      ],
      equipment: [
        { id: "e1", name: "Sunscreen", reason: "UV index 5" },
      ],
    },
    {
      id: "day-2",
      date: "2026-04-11",
      dayLabel: "Saturday, Apr 11",
      location: "Luckenwalde",
      condition: "caution",
      weather: {
        tempMin: 6,
        tempMax: 11,
        tempFeelsLike: 4,
        tempUnit: "°C",
        precipitation: 8,
        precipitationUnit: "mm",
        windSpeed: 25,
        windUnit: "km/h",
        windDirection: "W",
        humidity: 85,
        uvIndex: 1,
        sunrise: "06:13",
        sunset: "19:47",
        icon: "rain",
        description: "Rain expected",
      },
      clothingItems: [
        { id: "c2", name: "Rain Jacket", icon: "rain-jacket", reason: "8mm rain expected" },
        { id: "c3", name: "Waterproof Gloves", icon: "gloves-waterproof", reason: "Keep hands dry" },
      ],
      equipment: [
        { id: "e2", name: "Rear Fender", reason: "Protect against spray in wet conditions" },
      ],
    },
  ],
};
```
