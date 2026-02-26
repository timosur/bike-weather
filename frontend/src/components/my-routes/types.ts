import type { RideInput } from "../ride-planner/types";

/** Overall ride condition rating from the last Ride Report */
export type ConditionRating = "ideal" | "good" | "caution" | "not-recommended";

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
  /** Share token if the route is shared, null otherwise */
  shareToken: string | null;
  /** ISO timestamp when the route was saved */
  createdAt: string;
  /** Full RideInput for edit functionality, null for legacy routes */
  rideInput: RideInput | null;
}

export interface MyRoutesProps {
  routes: SavedRoute[];

  /** Called when the user taps a route card to fetch a fresh Ride Report */
  onRouteSelect?: (routeId: string) => void;

  /** Called when the user saves edits to a route's details */
  onRouteEdit?: (
    routeId: string,
    updates: Partial<Pick<SavedRoute, "name" | "startLocation" | "totalDistance" | "ridingStyle">>,
  ) => void;

  /** Called when the user confirms deletion of a route */
  onRouteDelete?: (routeId: string) => void;

  /** Called when the user wants to share a route */
  onRouteShare?: (routeId: string) => void;

  /** Called when the user wants to stop sharing a route */
  onRouteUnshare?: (routeId: string) => void;

  /** Called when the user wants to copy the share link of an already-shared route */
  onCopyShareLink?: (routeId: string) => void;

  /** Called when the user clicks the CTA in the empty state to navigate to Ride Planner */
  onNavigateToPlanner?: () => void;
}
