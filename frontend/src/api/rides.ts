import { apiFetch } from "./client";
import type { RideReport } from "../components/ride-report/types";
import type { RideInput } from "../components/ride-planner/types";

export async function fetchReport(rideInput: RideInput): Promise<RideReport> {
  return apiFetch<RideReport>("/rides/report", {
    method: "POST",
    body: JSON.stringify(rideInput),
  });
}
