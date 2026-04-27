/**
 * Build `keys` list for `POST /game-rooms/.../attempts` from a key event.
 * Maps Meta (Cmd) to `ctrl` so Mac input matches the server dataset.
 */
function canonicalKeyToken(value: string): string {
  const token = String(value).trim().toLowerCase();
  if (!token) return token;
  const map: Record<string, string> = {
    cmd: "ctrl",
    command: "ctrl",
    meta: "ctrl",
    control: "ctrl",
    del: "delete",
    numpadenter: "enter",
    return: "enter",
    shiftleft: "shift",
    shiftright: "shift",
  };
  return map[token] ?? token;
}

export function keysFromKeyboardEvent(event: KeyboardEvent): string[] {
  const k = canonicalKeyToken(event.key);

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

  const out = [...parts];
  if (k.length === 1) {
    if (!out.includes(k)) out.push(k);
    return out;
  }

  if (k === "f11" || k === "f4" || /^f\d{1,2}$/.test(k)) {
    if (!out.includes(k)) out.push(k);
    return out;
  }

  if (!out.includes(k)) out.push(k);
  return out;
}

/** Map a typed shortcut (e.g. "Ctrl + C", "meta+f4") to API key tokens. */
export function keysFromTextEntry(entered: string): string[] {
  const parts = entered
    .toLowerCase()
    .split(/[+\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(canonicalKeyToken);
  return Array.from(new Set(parts));
}
