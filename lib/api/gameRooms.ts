import { apiRequest } from "@/lib/api/client";
import type {
  AttemptRequest,
  AttemptResponse,
  GameRoomView,
  MatchResultsView,
  RematchAcceptanceResponse,
  RematchResponse,
} from "@/lib/api/types";

function encodeSegment(id: string): string {
  return encodeURIComponent(id);
}

/** GET /game-rooms/{room_id} */
export function getGameRoom(
  roomId: string,
  options?: { signal?: AbortSignal },
): Promise<GameRoomView> {
  return apiRequest<GameRoomView>(`/game-rooms/${encodeSegment(roomId)}`, {
    method: "GET",
    signal: options?.signal,
  });
}

/** POST /game-rooms/{room_id}/attempts */
export function submitGameAttempt(
  roomId: string,
  body: AttemptRequest,
  options?: { signal?: AbortSignal },
): Promise<AttemptResponse> {
  return apiRequest<AttemptResponse>(
    `/game-rooms/${encodeSegment(roomId)}/attempts`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}

/** GET /game-rooms/{room_id}/results */
export function getMatchResults(
  roomId: string,
  options?: { viewerPlayerId?: string | null; signal?: AbortSignal },
): Promise<MatchResultsView> {
  const q = new URLSearchParams();
  if (options?.viewerPlayerId) {
    q.set("player_id", options.viewerPlayerId);
  }
  const qs = q.toString();
  const path = `/game-rooms/${encodeSegment(roomId)}/results${
    qs ? `?${qs}` : ""
  }`;
  return apiRequest<MatchResultsView>(path, {
    method: "GET",
    signal: options?.signal,
  });
}

/** POST /game-rooms/{room_id}/rematch */
export function createRematch(
  roomId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<RematchResponse> {
  return apiRequest<RematchResponse>(
    `/game-rooms/${encodeSegment(roomId)}/rematch`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}

/** POST /game-rooms/{room_id}/rematch/accept */
export function acceptRematch(
  roomId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<RematchAcceptanceResponse> {
  return apiRequest<RematchAcceptanceResponse>(
    `/game-rooms/${encodeSegment(roomId)}/rematch/accept`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}

/** POST /game-rooms/{room_id}/rematch/decline */
export function declineRematch(
  roomId: string,
  body: { player_id: string },
  options?: { signal?: AbortSignal },
): Promise<RematchAcceptanceResponse> {
  return apiRequest<RematchAcceptanceResponse>(
    `/game-rooms/${encodeSegment(roomId)}/rematch/decline`,
    {
      method: "POST",
      body,
      signal: options?.signal,
    },
  );
}
