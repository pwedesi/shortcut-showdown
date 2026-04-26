/**
 * Build `keys` list for `POST /game-rooms/.../attempts` from a key event.
 * Maps Meta (Cmd) to `ctrl` so Mac input matches the server dataset.
 */
export function keysFromKeyboardEvent(event: KeyboardEvent): string[] {
  const raw = event.key;
  const k = raw.length === 1 ? raw.toLowerCase() : raw.toLowerCase();

  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    if (k === "f11") {
      return ["f11"];
    }
  }

  const parts: string[] = [];
  if (event.altKey) {
    parts.push("alt");
  }
  if (event.shiftKey) {
    parts.push("shift");
  }
  if (event.ctrlKey || event.metaKey) {
    parts.push("ctrl");
  }

  if (k.length === 1) {
    return [...parts, k];
  }

  if (k === "f11" || k === "f4" || /^f\d{1,2}$/.test(k)) {
    return [...parts, k];
  }

  return [...parts, k];
}

/** Map a typed shortcut (e.g. "Ctrl + C", "meta+f4") to API key tokens. */
export function keysFromTextEntry(entered: string): string[] {
  const t = entered
    .toLowerCase()
    .replace(/\bcommand\b/g, "meta")
    .replace(/\bcontrol\b/g, "ctrl");
  const parts = t
    .split(/[+\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) =>
      p === "cmd" || p === "meta" ? "ctrl" : p,
    );
  return parts;
}
