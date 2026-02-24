import type { LocationSuggestion } from "../components/ride-planner/types";

const API_BASE = "/api";

export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const response = await fetch(`${API_BASE}/geocoding/search?${params}`);
  if (!response.ok) return [];
  return response.json() as Promise<LocationSuggestion[]>;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<LocationSuggestion | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const response = await fetch(`${API_BASE}/geocoding/reverse?${params}`);
  if (!response.ok) return null;
  return response.json() as Promise<LocationSuggestion | null>;
}
