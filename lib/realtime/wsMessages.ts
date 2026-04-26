type ConnectEventPayload = {
  type?: string;
  event?: string;
  player_id?: string;
  payload?: { player_id?: string };
};

const RESERVED = new Set([
  "v",
  "type",
  "event",
  "payload",
]);

/**
 * Merges top-level and `payload` the way the API `build_message` does
 * (public fields are duplicated on the root object).
 */
export function mergeServerMessageBody(msg: unknown): Record<string, unknown> {
  if (typeof msg !== "object" || msg === null) {
    return {};
  }
  const o = msg as Record<string, unknown>;
  const base: Record<string, unknown> = {};
  const payload = o.payload;
  if (typeof payload === "object" && payload !== null) {
    Object.assign(base, payload as Record<string, unknown>);
  }
  for (const [k, v] of Object.entries(o)) {
    if (RESERVED.has(k)) continue;
    base[k] = v;
  }
  return base;
}

export function getMessageEventName(msg: unknown): string | null {
  if (typeof msg !== "object" || msg === null) {
    return null;
  }
  const o = msg as Record<string, unknown>;
  const t = o.type ?? o.event;
  return typeof t === "string" ? t : null;
}

/**
 * `event` / `type` of `connect` and `player_id` on the root or under `payload`.
 */
export function parseConnectPlayerIdFromMessage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const o = data as ConnectEventPayload;
  const ev = o.event ?? o.type;
  if (ev !== "connect") {
    return null;
  }
  if (typeof o.player_id === "string") {
    return o.player_id;
  }
  const pid = o.payload?.player_id;
  return typeof pid === "string" ? pid : null;
}

export function tryParseJsonString(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Parse a WS text frame for `connect` and `player_id` (versioned or legacy). */
export function parseConnectPlayerId(raw: string): string | null {
  const data = tryParseJsonString(raw);
  return parseConnectPlayerIdFromMessage(data);
}
