import { apiRequest } from "@/lib/api/client";

function encodeSegment(id: string): string {
  return encodeURIComponent(id);
}

export interface PlayerIdentityView {
  player_id: string;
  display_name: string;
  is_ready: boolean;
}

/** PATCH /players/{player_id} — update player's display name */
export async function updatePlayerDisplayName(
  playerId: string,
  displayName: string,
  options?: { signal?: AbortSignal },
): Promise<PlayerIdentityView> {
  return apiRequest<PlayerIdentityView>(
    `/players/${encodeSegment(playerId)}`,
    {
      method: "PATCH",
      body: { display_name: displayName },
      signal: options?.signal,
    },
  );
}

/** PATCH /players/{player_id} — update player's ready status */
export async function updatePlayerReadyStatus(
  playerId: string,
  isReady: boolean,
  options?: { signal?: AbortSignal },
): Promise<PlayerIdentityView> {
  return apiRequest<PlayerIdentityView>(
    `/players/${encodeSegment(playerId)}`,
    {
      method: "PATCH",
      body: { is_ready: isReady },
      signal: options?.signal,
    },
  );
}
