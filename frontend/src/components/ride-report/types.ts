/** Overall ride condition rating */
export type ConditionRating = "ideal" | "good" | "caution" | "not-recommended";

/** Weather icon identifier */
export type WeatherIconType =
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
  icon: WeatherIconType;
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
  reason: string;
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
  onShare?: () => void;
  onSaveRoute?: () => void;
  /** Whether the route is currently being saved */
  routeSaving?: boolean;
  /** Whether the route has been saved successfully */
  routeSaved?: boolean;
  onDaySelect?: (dayId: string) => void;
  onSwapClothingItem?: (dayId: string, itemId: string, alternativeId: string) => void;
  /** Available affiliate products to show inline */
  products?: import("../product-recommendations/types").Product[];
  /** Shop list for looking up shop names/logos */
  shops?: import("../product-recommendations/types").Shop[];
  /** Affiliate disclosure label and disclaimer text */
  disclosure?: import("../product-recommendations/types").AffiliateDisclosure;
  /** Called when the user clicks an affiliate product link */
  onProductClick?: (productId: string) => void;
}
