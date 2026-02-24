# Milestone 4: Product Recommendations

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–3 complete

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

Implement Product Recommendations — affiliate product cards shown inline in the Ride Report and as a standalone browsable category page.

## Overview

Products appear in two contexts: inline next to clothing recommendations in the Ride Report, and as a standalone Products page with category browsing. All product links are affiliate links with legally required "Ad" disclosure.

**Key Functionality:**
- Inline product links next to clothing recommendations
- Collected product section below the Ride Report
- Standalone category overview page
- Category detail page with product grid and weather filters
- Affiliate disclosure badges and disclaimer text

## Components Provided

- `InlineProductLink` — Compact product tip next to clothing cards
- `ReportProducts` — Collected products section below the report
- `ProductCategories` — Standalone category overview page
- `ProductCategoryDetail` — Category detail with product grid and filters
- `ProductCard` — Full product card with weather suitability badges
- `CategoryIcon` — Icon renderer for category cards

## Props Reference

| Callback | Triggered When |
|----------|---------------|
| `onProductClick` | User clicks an affiliate link |
| `onCategorySelect` | User selects a product category |
| `onBack` | User navigates back from category detail |

## Expected User Flows

### Flow 1: View product in Ride Report

1. User views a clothing recommendation card
2. User sees an inline product link below it
3. User clicks the product
4. **Outcome:** New tab opens to affiliate shop

### Flow 2: Browse standalone Products page

1. User navigates to /products
2. User sees category cards (Jackets, Gloves, Tights, etc.)
3. User clicks a category
4. User sees product grid with weather filter chips
5. **Outcome:** User can filter and click through to products

## Testing

See `product-plan/sections/product-recommendations/tests.md`.

## Done When

- [ ] Inline product links display in Ride Report
- [ ] Report products section renders below report
- [ ] Category overview page works
- [ ] Category detail with weather filters works
- [ ] Affiliate links open in new tab
- [ ] "Ad" badges and disclosure text display
- [ ] Responsive on mobile
