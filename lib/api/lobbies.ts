import { apiRequest } from "@/lib/api/client";
import type { Lobby, StartLobbyResponse } from "@/lib/api/types";

function encodeSegment(id: string): string {
  return encodeURIComponent(id);
}

/** POST /lobbies — create; body includes player_id. */
export function createLobby(
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  return apiRequest<Lobby>("/lobbies", {
    method: "POST",
    body,
    signal: options?.signal,
  });
}

/** POST /lobbies/{lobby_id}/join */
export function joinLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  return apiRequest<Lobby>(`/lobbies/${encodeSegment(lobbyId)}/join`, {
    method: "POST",
    body,
    signal: options?.signal,
  });
}

/** POST /lobbies/{lobby_id}/leave */
export function leaveLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<void> {
  return apiRequest<void>(`/lobbies/${encodeSegment(lobbyId)}/leave`, {
    method: "POST",
    body,
    signal: options?.signal,
  });
}

/** POST /lobbies/{lobby_id}/start */
export function startLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<StartLobbyResponse> {
  return apiRequest<StartLobbyResponse>(
    `/lobbies/${encodeSegment(lobbyId)}/start`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}

/** GET /lobbies/{lobby_id} */
export function getLobby(
  lobbyId: string,
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  return apiRequest<Lobby>(`/lobbies/${encodeSegment(lobbyId)}`, {
    method: "GET",
    signal: options?.signal,
  });
}
