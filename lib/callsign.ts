export const CALLSIGN_STORAGE_KEY = "shortcut-showdown:callsign";

export function loadCallsignFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    const v = window.localStorage.getItem(CALLSIGN_STORAGE_KEY);
    if (v && v.trim().length > 0) return v.trim();
  } catch {
    // ignore
  }
  return "";
}

export function saveCallsignToStorage(callsign: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CALLSIGN_STORAGE_KEY, callsign.trim());
  } catch {
    // ignore
  }
}
