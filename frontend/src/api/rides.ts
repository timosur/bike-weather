import { apiFetch } from "./client";
import type { RideReport } from "../components/ride-report/types";
import type { RideInput } from "../components/ride-planner/types";

export interface RoutePreview {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
}

export async function fetchRoutePreview(
  startLat: number,
  startLon: number,
  destLat: number,
  destLon: number
): Promise<RoutePreview> {
  const query = new URLSearchParams({
    startLat: startLat.toString(),
    startLon: startLon.toString(),
    destLat: destLat.toString(),
    destLon: destLon.toString(),
  });
  return apiFetch<RoutePreview>(`/rides/preview?${query.toString()}`);
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
      ...(captchaToken ? { captcha_token: captchaToken } : {}),
    }),
  });
}
