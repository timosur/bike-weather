import type { LocationSuggestion } from "../components/ride-planner/types";
import { apiFetch } from "./client";

export async function searchLocations(
  query: string,
  limit: number = 5,
): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  try {
    return await apiFetch<LocationSuggestion[]>(`/geocoding/search?${params}`, { method: "GET" });
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationSuggestion | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  try {
    return await apiFetch<LocationSuggestion | null>(`/geocoding/reverse?${params}`, {
      method: "GET",
    });
  } catch {
    return null;
  }
}
