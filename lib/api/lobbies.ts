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

/** POST /lobbies/{lobby_id}/lock */
export async function lockLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/lock`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/{lobby_id}/unlock */
export async function unlockLobby(
  lobbyId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/unlock`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/quick-play */
export async function quickPlay(
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>("/lobbies/quick-play", {
    method: "POST",
    body,
    signal: options?.signal,
  });
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/{lobby_id}/set-max-players */
export async function setMaxPlayers(
  lobbyId: string,
  body: { player_id: string; max_players: number },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/set-max-players`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/{lobby_id}/set-challenge-count */
export async function setChallengeCount(
  lobbyId: string,
  body: { player_id: string; challenge_count: number },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/set-challenge-count`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}

/** POST /lobbies/{lobby_id}/set-round-duration */
export async function setRoundDuration(
  lobbyId: string,
  body: { player_id: string; round_duration_seconds: number },
  options?: { signal?: AbortSignal },
): Promise<Lobby> {
  const data = await apiRequest<unknown>(
    `/lobbies/${encodeSegment(lobbyId)}/set-round-duration`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
  return normalizeLobbyFromApi(data);
}
