import { apiFetch } from "./client";
import type { RideReport } from "../components/ride-report/types";
import type { RideInput } from "../components/ride-planner/types";
import { uses12h } from "../lib/timeFormat";

export interface RoutePreview {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
}

export async function fetchRoutePreview(
  startLat: number,
  startLon: number,
  destLat: number,
  destLon: number,
  waypoints: [number, number][] = []
): Promise<RoutePreview> {
  return apiFetch<RoutePreview>("/rides/preview", {
    method: "POST",
    body: JSON.stringify({
      startLat,
      startLon,
      destLat,
      destLon,
      waypoints,
    }),
  });
}

export async function fetchReport(
  rideInput: RideInput,
  routeId?: string
): Promise<RideReport> {
  const params = routeId ? `?route_id=${encodeURIComponent(routeId)}` : "";
  const { captchaToken, ...rideFields } = rideInput;
  return apiFetch<RideReport>(`/rides/report${params}`, {
    method: "POST",
    body: JSON.stringify({
      ...rideFields,
      // Display-only: times inside generated report text follow the browser hour cycle
      hour12: uses12h(),
      ...(captchaToken ? { captcha_token: captchaToken } : {}),
    }),
  });
}
