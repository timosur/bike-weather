# Product Recommendations Tests

## Overview

Test the product recommendations system including category browsing, product cards with affiliate links, inline product links in the Ride Report, "Ad" badge visibility, weather suitability filters, and the affiliate disclosure notice.

## User Flow Tests

### Category Selection

1. Render `ProductCategories` with categories: Jackets (12 products), Gloves (8 products), Pants (6 products).
2. Verify three category cards are displayed with icons, names, and product counts.
3. Click the "Jackets" category card.
4. Verify `onCategorySelect` is called with the jackets category `id`.

### Category Detail View

1. Render `ProductCategoryDetail` with the Jackets category and 3 products.
2. Verify the category name "Jackets" is displayed as heading.
3. Verify 3 product cards are visible with image, name, price, and shop name.
4. Verify each product card displays the "Ad" badge (disclosure `badgeLabel`).
5. Verify the affiliate disclosure text is shown below the products.

### Product Click (Opens New Tab)

1. Render `ProductCategoryDetail` with products.
2. Click the affiliate link button on a product card.
3. Verify `onProductClick` is called with the product's `id`.
4. Verify the link has `target="_blank"` and `rel="noopener noreferrer"`.

### Back to Categories

1. Render `ProductCategoryDetail` with a "Back" button.
2. Click the "Back" button.
3. Verify `onBack` is called.

### Inline Product Link in Ride Report

1. Render `InlineProductLink` with a product, shop, and disclosure.
2. Verify the product name, price, and shop name are displayed.
3. Verify the "Ad" badge is visible.
4. Click the product link.
5. Verify `onProductClick` is called.

### Collected Products Section (ReportProducts)

1. Render `ReportProducts` with 5 products across 2 categories, shops, and disclosure.
2. Verify products are grouped by category.
3. Verify the affiliate disclaimer text is shown at the bottom.
4. Click a product card.
5. Verify `onProductClick` is called with the correct `productId`.

### Ad Badge Always Visible

1. Render any product card or link component.
2. Verify the "Ad" badge (e.g. "Anzeige") is always visible and not hidden or collapsed.

## Empty State Tests

### No Products in Category

1. Render `ProductCategoryDetail` with an empty `products` array.
2. Verify an empty state message is shown (e.g. "No products available in this category").

### No Categories

1. Render `ProductCategories` with an empty `categories` array.
2. Verify an empty state or "No categories available" message is shown.

## Component Interaction Tests

### ProductCard

1. Render `ProductCard` with a product.
2. Verify image, name, price (formatted with currency), and shop name are displayed.
3. Verify the "Ad" badge label matches `disclosure.badgeLabel`.

### CategoryIcon

1. Render `CategoryIcon` for each icon type: jacket, gloves, pants, headwear, shoes, light, accessories.
2. Verify each renders without error and is visually distinct.

### Weather Suitability Display

1. Render a `ProductCard` with weather suitability: `{ tempRange: { min: 5, max: 15, unit: "°C" }, precipitation: "heavy-rain", wind: "strong-wind", summary: "5-15 °C, wasserdicht, winddicht" }`.
2. Verify the weather suitability summary is displayed on the card.

## Edge Cases

- Product with very long name (100+ characters).
- Product with price 0 (free item).
- Product with `matchesZone: null` (equipment item, not clothing).
- Category with 50+ products (verify scrolling/pagination).
- Shop with no logo URL (fallback to shop name text).

## Accessibility Checks

- All product cards are keyboard-navigable.
- Affiliate links have descriptive `aria-label` (e.g. "Buy Short Sleeve Jersey at Amazon - Ad").
- "Ad" badge has sufficient color contrast.
- Category cards are focusable and activatable via Enter.
- Disclosure text is readable at standard text sizes.

## Sample Test Data

```typescript
const shops: Shop[] = [
  { id: "shop-1", name: "Amazon", logoUrl: "/logos/amazon.png", affiliateTag: "fahrradwetter-21" },
  { id: "shop-2", name: "bike-discount.de", logoUrl: "/logos/bike-discount.png", affiliateTag: null },
];

const categories: ProductCategory[] = [
  { id: "cat-jackets", name: "Jackets", icon: "jacket", productCount: 12 },
  { id: "cat-gloves", name: "Gloves", icon: "gloves", productCount: 8 },
  { id: "cat-pants", name: "Pants", icon: "pants", productCount: 6 },
];

const products: Product[] = [
  {
    id: "prod-1",
    name: "Gore-Tex Cycling Jacket",
    categoryId: "cat-jackets",
    imageUrl: "/images/goretex-jacket.jpg",
    price: 149.99,
    currency: "EUR",
    shopId: "shop-1",
    affiliateUrl: "https://amazon.de/dp/B0EXAMPLE?tag=fahrradwetter-21",
    matchesZone: "upperBody",
    matchesLabel: "Rain Jacket",
    weather: {
      tempRange: { min: 5, max: 15, unit: "°C" },
      precipitation: "heavy-rain",
      wind: "strong-wind",
      summary: "5-15 °C, wasserdicht, winddicht",
    },
  },
  {
    id: "prod-2",
    name: "Castelli Perfetto Gloves",
    categoryId: "cat-gloves",
    imageUrl: "/images/castelli-gloves.jpg",
    price: 59.99,
    currency: "EUR",
    shopId: "shop-2",
    affiliateUrl: "https://bike-discount.de/castelli-gloves",
    matchesZone: "hands",
    matchesLabel: "Warm Gloves",
    weather: {
      tempRange: { min: 0, max: 10, unit: "°C" },
      precipitation: "light-rain",
      wind: "light-wind",
      summary: "0-10 °C, leichter Regen",
    },
  },
];

const disclosure: AffiliateDisclosure = {
  badgeLabel: "Anzeige",
  disclaimerText:
    "Links marked with * are affiliate links. If you make a purchase through these links we receive a commission — the price for you stays the same.",
};
```
