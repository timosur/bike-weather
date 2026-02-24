import { apiFetch } from "./client";
import type { SavedRoute } from "../components/my-routes/types";

export interface CreateRouteData {
  name: string;
  start_location: string;
  total_distance: number;
  distance_unit?: string;
  riding_style: string;
}

export interface UpdateRouteData {
  name?: string;
  start_location?: string;
  total_distance?: number;
  distance_unit?: string;
  riding_style?: string;
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
  created_at: string;
}

function mapRoute(r: SavedRouteAPI): SavedRoute {
  return {
    id: r.id,
    name: r.name,
    startLocation: r.start_location,
    totalDistance: r.total_distance,
    distanceUnit: r.distance_unit,
    ridingStyle: r.riding_style as SavedRoute["ridingStyle"],
    lastCondition: r.last_condition
      ? (r.last_condition as SavedRoute["lastCondition"])
      : null,
    lastUsed: r.last_used,
    createdAt: r.created_at,
  };
}

export async function fetchRoutes(): Promise<SavedRoute[]> {
  const data = await apiFetch<SavedRouteAPI[]>("/routes");
  return data.map(mapRoute);
}

export async function createRoute(data: CreateRouteData): Promise<SavedRoute> {
  const result = await apiFetch<SavedRouteAPI>("/routes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return mapRoute(result);
}

export async function updateRoute(
  id: string,
  updates: UpdateRouteData
): Promise<SavedRoute> {
  const result = await apiFetch<SavedRouteAPI>(`/routes/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return mapRoute(result);
}

export async function deleteRoute(id: string): Promise<void> {
  await apiFetch<void>(`/routes/${id}`, { method: "DELETE" });
}
