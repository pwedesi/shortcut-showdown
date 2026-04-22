export const CALLSIGN_STORAGE_KEY = "shortcut-showdown:callsign";

export const DEFAULT_CALLSIGN = "OPERATOR_01";

export function loadCallsignFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_CALLSIGN;
  try {
    const v = window.localStorage.getItem(CALLSIGN_STORAGE_KEY);
    if (v && v.trim().length > 0) return v.trim();
  } catch {
    // ignore
  }
  return DEFAULT_CALLSIGN;
}

export function saveCallsignToStorage(callsign: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CALLSIGN_STORAGE_KEY, callsign.trim());
  } catch {
    // ignore
  }
}
