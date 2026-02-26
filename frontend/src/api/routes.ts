import { apiFetch } from "./client";
import type { SavedRoute } from "../components/my-routes/types";
import type { RideInput } from "../components/ride-planner/types";

export interface CreateRouteData {
  name: string;
  start_location: string;
  total_distance: number;
  distance_unit?: string;
  riding_style: string;
  ride_input?: RideInput;
}

export interface UpdateRouteData {
  name?: string;
  start_location?: string;
  total_distance?: number;
  distance_unit?: string;
  riding_style?: string;
  ride_input?: RideInput;
}

interface SavedRouteAPI {
  id: string;
  name: string;
  start_location: string;
  total_distance: number;
  distance_unit: string;
  riding_style: string;
  last_condition: string;
  last_used: string | null;
  share_token: string | null;
  created_at: string;
  ride_input: RideInput | null;
}

function mapRoute(r: SavedRouteAPI): SavedRoute {
  return {
    id: r.id,
    name: r.name,
    startLocation: r.start_location,
    totalDistance: r.total_distance,
    distanceUnit: r.distance_unit,
    ridingStyle: r.riding_style as SavedRoute["ridingStyle"],
    lastCondition: r.last_condition ? (r.last_condition as SavedRoute["lastCondition"]) : null,
    lastUsed: r.last_used,
    shareToken: r.share_token,
    createdAt: r.created_at,
    rideInput: r.ride_input,
  };
}

export async function fetchRoutes(): Promise<SavedRoute[]> {
  const data = await apiFetch<SavedRouteAPI[]>("/routes");
  return data.map(mapRoute);
}

export async function fetchRoute(id: string): Promise<SavedRoute> {
  const data = await apiFetch<SavedRouteAPI>(`/routes/${id}`);
  return mapRoute(data);
}

export async function createRoute(data: CreateRouteData): Promise<SavedRoute> {
  const result = await apiFetch<SavedRouteAPI>("/routes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return mapRoute(result);
}

export async function updateRoute(id: string, updates: UpdateRouteData): Promise<SavedRoute> {
  const result = await apiFetch<SavedRouteAPI>(`/routes/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return mapRoute(result);
}

export async function deleteRoute(id: string): Promise<void> {
  await apiFetch<void>(`/routes/${id}`, { method: "DELETE" });
}
