/** Icon identifier for product categories */
export type CategoryIcon =
  | "jacket"
  | "gloves"
  | "pants"
  | "headwear"
  | "shoes"
  | "light"
  | "accessories";

/** Clothing zone this product matches (from Ride Report) */
export type ClothingZoneId = "head" | "upperBody" | "lowerBody" | "hands" | "feet";

export interface Shop {
  id: string;
  name: string;
  logoUrl: string;
  affiliateTag: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: CategoryIcon;
  productCount: number;
}

/** Temperature range a product is suited for (°C) */
export interface TempRange {
  min: number;
  max: number;
  unit: "°C";
}

/** Precipitation resistance level */
export type PrecipitationRating = "none" | "light-rain" | "heavy-rain" | "snow";

/** Wind protection level */
export type WindRating = "none" | "light-wind" | "strong-wind";

/** Structured weather suitability for a product */
export interface WeatherSuitability {
  /** Temperature range the product is designed for, null if not temperature-specific */
  tempRange: TempRange | null;
  /** Maximum precipitation the product handles */
  precipitation: PrecipitationRating;
  /** Wind protection level */
  wind: WindRating;
  /** Short human-readable summary, e.g. "5–15 °C, wasserdicht, winddicht" */
  summary: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  price: number;
  currency: string;
  shopId: string;
  affiliateUrl: string;
  /** Which clothing zone this product matches, null for equipment items */
  matchesZone: ClothingZoneId | null;
  /** The clothing/equipment label this product is recommended for */
  matchesLabel: string;
  /** Detailed weather suitability specs */
  weather: WeatherSuitability;
}

/** Affiliate disclosure text for legal compliance (German advertising law) */
export interface AffiliateDisclosure {
  /** Short label shown on each product card, e.g. "Anzeige" */
  badgeLabel: string;
  /** Full disclosure text shown below product sections */
  disclaimerText: string;
}

/** Props for inline product link shown next to a clothing recommendation */
export interface InlineProductProps {
  product: Product;
  shop: Shop;
  disclosure: AffiliateDisclosure;

  /** Called when the user clicks the affiliate link */
  onProductClick?: (productId: string) => void;
}

/** Props for the collected product section below the Ride Report */
export interface ReportProductsProps {
  products: Product[];
  shops: Shop[];
  disclosure: AffiliateDisclosure;

  /** Called when the user clicks an affiliate link */
  onProductClick?: (productId: string) => void;
}

/** Props for the standalone Products category overview page */
export interface ProductCategoriesProps {
  categories: ProductCategory[];

  /** Called when the user selects a category */
  onCategorySelect?: (categoryId: string) => void;
}

/** Props for the category detail view */
export interface ProductCategoryDetailProps {
  category: ProductCategory;
  products: Product[];
  shops: Shop[];
  disclosure: AffiliateDisclosure;

  /** Called when the user clicks an affiliate link */
  onProductClick?: (productId: string) => void;

  /** Called when the user navigates back to the category overview */
  onBack?: () => void;
}
