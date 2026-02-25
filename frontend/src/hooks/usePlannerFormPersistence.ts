import { useState, useCallback } from "react";
import type { RideInput } from "../components/ride-planner/types";

const STORAGE_KEY = "bike-weather:planner-form";

function loadFormState(): Partial<RideInput> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function usePlannerFormPersistence() {
  const [savedFormState, setSavedFormState] = useState<Partial<RideInput> | null>(loadFormState);

  const saveFormState = useCallback((input: RideInput) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      setSavedFormState(input);
    } catch {
      // ignore
    }
  }, []);

  const clearFormState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedFormState(null);
  }, []);

  return { savedFormState, saveFormState, clearFormState };
}
