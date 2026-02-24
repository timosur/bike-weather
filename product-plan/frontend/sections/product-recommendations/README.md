# Product Recommendations

## Overview

Curated affiliate product recommendations displayed contextually alongside clothing and equipment recommendations in the Ride Report. Includes inline product links in the report, a collected product section below the report, and a standalone category browsing page. All affiliate links are clearly marked with an "Ad" badge for German advertising law compliance.

## User Flows

1. **Inline Product Links:** User sees a compact product link (image, name, price, shop name, "Ad" badge) next to each clothing recommendation in the Ride Report.
2. **Collected Products:** User scrolls below the Ride Report and sees all recommended products for the day grouped by category.
3. **Product Click:** User clicks a product and is redirected to the external shop via affiliate link in a new tab.
4. **Category Browse:** User navigates to the standalone "Products" page and sees a category overview (jackets, gloves, lights, etc.).
5. **Category Detail:** User selects a category and sees all available products in that category with filters.
6. **Back to Categories:** User clicks "Back" to return to the category overview.

## Components Provided

### `ProductCategories`

Category overview page. Displays categories as a card grid with icon and title. Clicking a card navigates to the category detail view.

### `ProductCategoryDetail`

Category detail view. Shows all products in a selected category with image, name, price, shop name, and affiliate link button. Includes a back button and the affiliate disclosure notice.

### `ProductCard`

Individual product card used in the category detail view and collected products section. Displays product image, name, price, shop name, and "Ad" badge.

### `ReportProducts`

Collected product section rendered below the Ride Report. Groups recommended products by category in a card grid with the affiliate disclosure notice.

### `InlineProductLink`

Compact product link shown next to clothing recommendations in the Ride Report. Displays product image, name, price, and a small "Ad" badge.

### `CategoryIcon`

Renders a category-specific icon (jacket, gloves, pants, headwear, shoes, light, accessories).

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onProductClick` | `(productId: string) => void` | Called when the user clicks an affiliate product link. Host should open the affiliate URL in a new tab. |
| `onCategorySelect` | `(categoryId: string) => void` | Called when the user selects a category card. Host should navigate to the category detail view. |
| `onBack` | `() => void` | Called when the user clicks "Back" on the category detail view. Host should navigate to the category overview. |

## Data Dependencies

- `categories: ProductCategory[]` -- Category list with names, icons, and product counts
- `products: Product[]` -- Product list with weather suitability metadata
- `shops: Shop[]` -- Shop metadata (name, logo, affiliate tag)
- `disclosure: AffiliateDisclosure` -- "Ad" badge label and disclaimer text
