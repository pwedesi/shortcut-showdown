import { apiRequest } from "@/lib/api/client";
import type { GameRoomView, Lobby } from "@/lib/api/types";
import { normalizeLobbyFromApi } from "@/lib/lobby/players";

function encodeSegment(id: string): string {
  return encodeURIComponent(id);
}

/** POST /lobbies — create; body includes player_id. */
export async function createLobby(
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>("/lobbies", {
    method: "POST",
    body,
    signal: options?.signal,
  });
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/{lobby_id}/join */
export async function joinLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/join`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
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
): Promise<GameRoomView> {
  return apiRequest<GameRoomView>(
    `/lobbies/${encodeSegment(lobbyId)}/start`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}

/** GET /lobbies/{lobby_id} */
export async function getLobby(
  lobbyId: string,
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}`,
    {
      method: "GET",
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}
