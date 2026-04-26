import { apiRequest } from "@/lib/api/client";
import type { AttemptRequest, AttemptResponse, GameRoomView } from "@/lib/api/types";

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
