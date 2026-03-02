export type BikeType = "rennrad" | "gravel" | "mtb" | "city";

export type RidingIntensity = "gemuetlich" | "moderat" | "sportlich";

export type GravelStyle = "road" | "offroad";

export interface RideLocation {
  address: string;
  lat?: number;
  lon?: number;
}

export interface DayStop {
  location: RideLocation;
  /** Planned km for this day (optional) */
  plannedKm?: number | null;
  /** Start date for this day (ISO YYYY-MM-DD, auto-calculated from main startDate + index) */
  startDate?: string;
  /** Start time for this day (HH:MM, defaults to 08:00) */
  startTime?: string;
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
  /** Optional planned ride duration in minutes (auto-estimated from distance + speed if not set) */
  durationMinutes?: number | null;
  /** Optional average speed in km/h (user override for duration estimation) */
  averageSpeedKmh?: number | null;
  /** Gravel riding style — only relevant when bikeType is "gravel" */
  gravelStyle?: GravelStyle | null;
  /** Per-day overnight stops for multi-day tours (one per night) */
  dayStops: DayStop[];
  /** Turnstile CAPTCHA token (sent when throttle threshold exceeded) */
  captchaToken?: string;
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

export interface ValidationErrors {
  location: string | null;
  startDate: string | null;
  startTime: string | null;
  bikeType: string | null;
  intensity: string | null;
}

/** Edit mode configuration for RidePlanner */
export interface EditModeConfig {
  /** Route ID being edited */
  routeId: string;
  /** Original saved RideInput for change detection */
  originalInput: RideInput;
}

export interface RidePlannerProps {
  /** Initial form values, e.g. pre-filled from a saved route */
  initialValues?: Partial<RideInput>;
  /** GPS-detected location injected after mount — updates only the location field without resetting other fields */
  detectedLocation?: RideLocation | null;
  /** Autocomplete suggestions to display as the user types a location */
  locationSuggestions?: LocationSuggestion[];
  /** The four bike type options to display */
  bikeTypeOptions: BikeTypeOption[];
  /** The three riding intensity options to display in the segmented control */
  intensityOptions: RidingIntensityOption[];
  /** Active validation errors to display inline */
  validationErrors?: ValidationErrors;
  /** Whether the form is currently submitting (shows loading state on button) */
  isLoading?: boolean;
  /** Source of the initial form values — shown as an info banner */
  formSource?: "restored" | "route" | "history" | null;
  /** Called when the user wants to reset the form to defaults */
  onReset?: () => void;
  /** Called when the user types in the location field */
  onLocationSearch?: (query: string) => void;
  /** Called when the user requests GPS geolocation */
  onUseCurrentLocation?: () => void;
  /** Called when the user selects a location suggestion */
  onLocationSelect?: (suggestion: LocationSuggestion) => void;
  /** Autocomplete suggestions for day stop location search */
  dayStopLocationSuggestions?: LocationSuggestion[];
  /** Called when the user types in a day stop location field */
  onDayStopLocationSearch?: (stopIndex: number, query: string) => void;
  /** Called when the user submits the form with valid input */
  onSubmit: (input: RideInput) => void;
  /** Optional slot rendered between presets and the form card (e.g. recent rides) */
  children?: React.ReactNode;
}
