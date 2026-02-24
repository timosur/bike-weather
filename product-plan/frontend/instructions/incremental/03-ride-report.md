# Milestone 3: Ride Report

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–2 complete

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Implement the Ride Report — the results page displaying weather data, clothing recommendations, and equipment checklist.

## Overview

After submitting the Ride Planner, users see a detailed weather summary, personalised clothing item cards, and an equipment checklist. Multi-day tours use tabs to navigate between days. A colour-coded condition badge gives an at-a-glance assessment.

**Key Functionality:**
- Day-by-day weather breakdown with tabs for multi-day tours
- Colour-coded condition rating (Ideal/Good/Caution/Not Recommended)
- Individual clothing item cards with swap alternatives
- Equipment checklist with reasons
- Share and save route actions

## Components Provided

- `RideReport` — Main report wrapper
- `DayTabs` — Tab navigation for multi-day tours
- `WeatherPanel` — Weather data display with icons
- `ClothingItemCard` — Individual clothing recommendation with swap
- `EquipmentList` — Static equipment checklist
- `ConditionBadge` — Colour-coded condition indicator
- `WeatherIcon` — Weather icon renderer

## Props Reference

**Data props:**
- `report: RideReport` — Full report data with days array

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onShare` | User clicks share button |
| `onSaveRoute` | User clicks save route |
| `onDaySelect` | User switches day tab |
| `onSwapClothingItem` | User swaps a clothing alternative |
| `onProductClick` | User clicks an affiliate product |

## Expected User Flows

### Flow 1: View single-day report

1. User arrives from Ride Planner
2. User sees condition badge, weather data, clothing cards, and equipment list
3. **Outcome:** Full recommendation displayed

### Flow 2: Navigate multi-day tour

1. User sees tabs with dates and weather icons
2. User clicks a different day tab
3. **Outcome:** Weather, clothing, and equipment update for selected day

### Flow 3: Swap clothing alternative

1. User sees a clothing card with swap options
2. User clicks an alternative
3. **Outcome:** Card updates to show the alternative item

## Testing

See `product-plan/sections/ride-report/tests.md`.

## Files to Reference

- `product-plan/sections/ride-report/components/`
- `product-plan/sections/ride-report/types.ts`
- `product-plan/sections/ride-report/sample-data.json`

## Done When

- [ ] Weather data displays correctly
- [ ] Condition badge shows correct colour
- [ ] Clothing cards render with swap alternatives
- [ ] Equipment checklist renders
- [ ] Day tabs work for multi-day tours
- [ ] Share and save route callbacks wired
- [ ] Responsive on mobile
