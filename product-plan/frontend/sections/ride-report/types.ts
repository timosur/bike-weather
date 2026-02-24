import type { Product, Shop, AffiliateDisclosure } from '../product-recommendations/types'

/** Overall ride condition rating */
export type ConditionRating = "ideal" | "good" | "caution" | "not-recommended";

/** Weather icon identifier */
export type WeatherIcon = "sun" | "cloud-sun" | "cloud" | "rain" | "snow" | "thunderstorm" | "fog";

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

export interface RideReportProps {
  report: RideReport;

  /** Called when the user taps the share button */
  onShare?: () => void;

  /** Called when the user wants to save this route to "My Routes" */
  onSaveRoute?: () => void;

  /** Called when the user selects a different day tab */
  onDaySelect?: (dayId: string) => void;

  /** Called when the user swaps a clothing item for an alternative */
  onSwapClothingItem?: (dayId: string, itemId: string, alternativeId: string) => void;

  /** Available affiliate products to show inline */
  products?: Product[];

  /** Shop list for looking up shop names/logos */
  shops?: Shop[];

  /** Affiliate disclosure label and disclaimer text */
  disclosure?: AffiliateDisclosure;

  /** Called when the user clicks an affiliate product link */
  onProductClick?: (productId: string) => void;
}
