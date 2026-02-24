// =============================================================================
// Fahrrad Wetter — Aggregated Data Shape Interfaces
// =============================================================================
// These are the data contracts that UI components expect via props.
// They are NOT backend database models — the implementation agent decides
// storage, fetching, and transformation.
// =============================================================================

// -----------------------------------------------------------------------------
// Ride Planner
// -----------------------------------------------------------------------------

export type BikeType = "rennrad" | "gravel" | "mtb" | "city";

export type RidingIntensity = "gemuetlich" | "moderat" | "sportlich";

export interface RideLocation {
  address: string;
  lat?: number;
  lon?: number;
}

export interface DayStop {
  location: RideLocation;
  /** Planned km for this day (optional) */
  plannedKm?: number | null;
}

export interface RideInput {
  location: RideLocation | null;
  startDate: string; // ISO date string: YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string | null; // auto-calculated from number of days, null if single-day
  isMultiDay: boolean;
  bikeType: BikeType;
  intensity: RidingIntensity;
  /** Optional distance in km */
  distanceKm?: number | null;
  /** Optional elevation in meters */
  elevationMeters?: number | null;
  /** Per-day overnight stops for multi-day tours (one per night) */
  dayStops: DayStop[];
}

export interface LocationSuggestion {
  id: string;
  displayText: string;
  shortText: string;
  lat: number;
  lon: number;
}

export interface BikeTypeOption {
  value: BikeType;
  label: string;
  description: string;
  icon: string;
}

export interface RidingIntensityOption {
  value: RidingIntensity;
  label: string;
  description: string;
}

export interface QuickPreset {
  id: string;
  label: string;
  description: string;
  bikeType: BikeType;
  intensity: RidingIntensity;
  distanceKm?: number;
  isMultiDay: boolean;
}

export interface ValidationErrors {
  location: string | null;
  startDate: string | null;
  startTime: string | null;
  bikeType: string | null;
  intensity: string | null;
}

// -----------------------------------------------------------------------------
// Ride Report
// -----------------------------------------------------------------------------

/** Overall ride condition rating */
export type ConditionRating = "ideal" | "good" | "caution" | "not-recommended";

/** Weather icon identifier */
export type WeatherIcon =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "rain"
  | "snow"
  | "thunderstorm"
  | "fog";

/** Icon identifier for clothing items */
export type ClothingIcon =
  | "headband"
  | "helmet-cover"
  | "sunglasses"
  | "glasses"
  | "base-layer"
  | "jersey"
  | "jersey-long"
  | "vest"
  | "jacket"
  | "rain-jacket"
  | "pants-short"
  | "pants-long"
  | "leg-warmers"
  | "arm-warmers"
  | "overpants"
  | "gloves-light"
  | "gloves-warm"
  | "gloves-waterproof"
  | "shoes"
  | "shoe-covers"
  | "socks";

export interface WeatherData {
  tempMin: number;
  tempMax: number;
  tempFeelsLike: number;
  tempUnit: string;
  precipitation: number;
  precipitationUnit: string;
  windSpeed: number;
  windUnit: string;
  windDirection: string;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  icon: WeatherIcon;
  description: string;
}

export interface ClothingAlternative {
  id: string;
  name: string;
  icon: ClothingIcon;
}

export interface ClothingItem {
  id: string;
  name: string;
  icon: ClothingIcon;
  /** Short explanation of why this item is recommended and what purpose it serves */
  reason: string;
  /** Alternative items the user can swap to */
  alternatives?: ClothingAlternative[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  reason: string;
}

export interface DayForecast {
  id: string;
  date: string;
  dayLabel: string;
  /** Location name for this day's weather (overnight stop / start location) */
  location?: string;
  condition: ConditionRating;
  weather: WeatherData;
  clothingItems: ClothingItem[];
  equipment: EquipmentItem[];
}

export interface RideReport {
  id: string;
  rideName: string;
  startLocation: string;
  ridingStyle: string;
  totalDistance: number;
  distanceUnit: string;
  overallCondition: ConditionRating;
  shareUrl: string;
  days: DayForecast[];
}

// -----------------------------------------------------------------------------
// Product Recommendations
// -----------------------------------------------------------------------------

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
export type ClothingZoneId =
  | "head"
  | "upperBody"
  | "lowerBody"
  | "hands"
  | "feet";

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

/** Temperature range a product is suited for (degrees C) */
export interface TempRange {
  min: number;
  max: number;
  unit: "°C";
}

/** Precipitation resistance level */
export type PrecipitationRating =
  | "none"
  | "light-rain"
  | "heavy-rain"
  | "snow";

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
  /** Short human-readable summary, e.g. "5-15 degrees C, wasserdicht, winddicht" */
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

// -----------------------------------------------------------------------------
// My Routes
// -----------------------------------------------------------------------------

/** Riding style matching Ride Planner options */
export type RidingStyle = "Sporty" | "Easy" | "Touring";

export interface SavedRoute {
  id: string;
  name: string;
  startLocation: string;
  totalDistance: number;
  distanceUnit: string;
  ridingStyle: RidingStyle;
  /** Condition from the most recent Ride Report, null if never run */
  lastCondition: ConditionRating | null;
  /** ISO timestamp of the last report fetch, null if never run */
  lastUsed: string | null;
  /** ISO timestamp when the route was saved */
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export type AuthTab = "login" | "register";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

// -----------------------------------------------------------------------------
// FAQ
// -----------------------------------------------------------------------------

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// -----------------------------------------------------------------------------
// Contact
// -----------------------------------------------------------------------------

export type ContactCategory = "feedback" | "bug" | "feature" | "sonstiges";

export interface ContactFormData {
  category: ContactCategory;
  name: string;
  email: string;
  message: string;
}
