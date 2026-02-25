import { apiFetch } from "./client";
import type { RideReport } from "../components/ride-report/types";
import type { RideInput } from "../components/ride-planner/types";

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
