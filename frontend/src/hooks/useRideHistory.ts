import { useState, useCallback } from "react";
import type { RideInput, RideLocation } from "../components/ride-planner/types";
import type { RideReport } from "../components/ride-report/types";

const STORAGE_KEY = "bike-weather:ride-history";
const MAX_ENTRIES = 10;

export interface RideHistoryEntry {
  id: string;
  timestamp: number;
  rideInput: RideInput;
  /** Report with hourlyForecast stripped to save localStorage space */
  report: RideReport;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Strip hourlyForecast from cached reports to keep localStorage size reasonable */
function trimReport(report: RideReport): RideReport {
  return {
    ...report,
    days: report.days.map((day) => ({
      ...day,
      hourlyForecast: undefined,
    })),
  };
}

function locKey(loc: RideLocation | null): string {
  if (!loc) return "";
  return loc.lat != null && loc.lon != null ? `${loc.lat},${loc.lon}` : (loc.address ?? "");
}

/** Same route (start, destination, waypoints) + bike type = same ride */
function rideKey(input: RideInput): string {
  return JSON.stringify([
    locKey(input.location),
    locKey(input.destination),
    (input.waypoints ?? []).map((w) => [locKey(w.location), w.type]),
    input.bikeType,
  ]);
}

function loadHistory(): RideHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(entries: RideHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — evict oldest entries and retry
    const trimmed = entries.slice(-Math.floor(MAX_ENTRIES / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

export function useRideHistory() {
  const [history, setHistory] = useState<RideHistoryEntry[]>(loadHistory);

  const addEntry = useCallback((rideInput: RideInput, report: RideReport) => {
    setHistory((prev) => {
      const entry: RideHistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        rideInput,
        report: trimReport(report),
      };
      // Replace an identical older ride, prepend new entry, cap at MAX_ENTRIES
      const key = rideKey(rideInput);
      const next = [entry, ...prev.filter((e) => rideKey(e.rideInput) !== key)].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  const getEntry = useCallback(
    (id: string): RideHistoryEntry | undefined => {
      return history.find((e) => e.id === id);
    },
    [history],
  );

  return { history, addEntry, removeEntry, clearHistory, getEntry };
}
