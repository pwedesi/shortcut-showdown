type ConnectEventPayload = {
  event?: string;
  player_id?: string;
};

/** Parse first WS text message for `event: connect` and `player_id`. */
export function parseConnectPlayerId(raw: string): string | null {
  try {
    const data: unknown = JSON.parse(raw) as ConnectEventPayload;
    if (
      typeof data === "object" &&
      data !== null &&
      (data as ConnectEventPayload).event === "connect" &&
      typeof (data as ConnectEventPayload).player_id === "string"
    ) {
      return (data as ConnectEventPayload).player_id!;
    }
  } catch {
    // ignore
  }
  return null;
}
