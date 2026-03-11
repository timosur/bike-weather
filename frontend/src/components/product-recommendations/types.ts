/** Icon identifier for product categories */
export type CategoryIcon =
  | "jacket"
  | "rain-jacket"
  | "jersey"
  | "base-layer"
  | "vest"
  | "pants-long"
  | "pants-short"
  | "overpants"
  | "gloves-waterproof"
  | "gloves-light"
  | "headwear"
  | "shoes"
  | "shoe-covers"
  | "eyewear"
  | "neck-gaiter"
  | "light"
  | "accessories";

/** Clothing zone this product matches (from Ride Report) */
export type ClothingZoneId = "head" | "eyes" | "neck" | "upperBody" | "lowerBody" | "hands" | "feet";

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
  tempRange: TempRange | null;
  precipitation: PrecipitationRating;
  wind: WindRating;
  summary: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  shopId: string;
  affiliateUrl: string;
  matchesZone: ClothingZoneId | null;
  matchesLabel: string;
  matchesIcon?: string;
  weather: WeatherSuitability;
}

/** Affiliate disclosure text for legal compliance */
export interface AffiliateDisclosure {
  badgeLabel: string;
  disclaimerText: string;
}

/** Props for inline product link shown next to a clothing recommendation */
export interface InlineProductProps {
  product: Product;
  shop: Shop;
  disclosure: AffiliateDisclosure;
  onProductClick?: (productId: string) => void;
}

/** Props for the collected product section below the Ride Report */
export interface ReportProductsProps {
  products: Product[];
  shops: Shop[];
  disclosure: AffiliateDisclosure;
  onProductClick?: (productId: string) => void;
}

/** Props for the standalone Products category overview page */
export interface ProductCategoriesProps {
  categories: ProductCategory[];
  onCategorySelect?: (categoryId: string) => void;
}

/** Props for the category detail view */
export interface ProductCategoryDetailProps {
  category: ProductCategory;
  products: Product[];
  shops: Shop[];
  disclosure: AffiliateDisclosure;
  onProductClick?: (productId: string) => void;
  onBack?: () => void;
}
