export type BikeType = "rennrad" | "gravel" | "mtb" | "city";

export type RidingIntensity = "gemuetlich" | "moderat" | "sportlich";

export type GravelStyle = "road" | "offroad";

export type WaypointType = "stop" | "sleep";

export interface RideLocation {
  address?: string;
  lat?: number;
  lon?: number;
}

export interface Waypoint {
  location: RideLocation;
  type: WaypointType;
  name?: string;
  startTime?: string;
}

export interface RideInput {
  location: RideLocation | null;
  startDate: string; // ISO date string: YYYY-MM-DD
  startTime: string; // HH:MM
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
  /** Waypoints between start and destination (stop = pass-through, sleep = overnight) */
  waypoints: Waypoint[];
  /** Destination for route planning (required) */
  destination: RideLocation | null;
  /** Imported route geometry — when present, OSRM routing is skipped */
  importedGeometry?: number[][];
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
  destination: string | null;
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
  /** Called when the user types in the destination field */
  onDestinationSearch?: (query: string) => void;
  /** Autocomplete suggestions for destination search */
  destinationSuggestions?: LocationSuggestion[];
  /** Autocomplete suggestions for waypoint location search */
  waypointLocationSuggestions?: LocationSuggestion[];
  /** Called when the user types in a waypoint location field */
  onWaypointLocationSearch?: (waypointIndex: number, query: string) => void;
  /** Called when the user wants to open the GPX import dialog */
  onGpxImport?: () => void;
  /** Called when the user submits the form with valid input */
  onSubmit: (input: RideInput) => void;
  /** Called when the form dirty state changes (true = has unsaved changes) */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Optional slot rendered between presets and the form card (e.g. recent rides) */
  children?: React.ReactNode;
}
