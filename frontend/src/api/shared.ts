import { apiFetch } from "./client";
import type { RideReport } from "../components/ride-report/types";

export interface ShareRouteResponse {
  share_token: string;
  share_url: string;
}

/** Build the public share URL from a token (always uses the current frontend origin). */
export function getShareUrl(token: string): string {
  return `${window.location.origin}/shared/${token}`;
}

export async function shareRoute(routeId: string): Promise<ShareRouteResponse> {
  return apiFetch<ShareRouteResponse>(`/routes/${routeId}/share`, {
    method: "POST",
  });
}

export async function unshareRoute(routeId: string): Promise<void> {
  await apiFetch<void>(`/routes/${routeId}/share`, { method: "DELETE" });
}

export async function fetchSharedReport(token: string): Promise<RideReport> {
  return apiFetch<RideReport>(`/shared/${token}`);
}
