import { getMatchResults } from "@/lib/api/gameRooms";
import { ApiError } from "@/lib/api/types";
import type { MatchResultsView } from "@/lib/api/types";

const MATCH_NOT_FINISHED = "match_not_finished";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Immediately after gameplay, the room can briefly still report
 * `match_not_finished`. Poll a few times before surfacing an error.
 */
export async function fetchMatchResultsWithRetry(
  roomId: string,
  viewerPlayerId: string | null,
  options?: {
    signal?: AbortSignal;
    attempts?: number;
    delayMs?: number;
  },
): Promise<MatchResultsView> {
  const maxAttempts = options?.attempts ?? 8;
  const delayMs = options?.delayMs ?? 400;
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    if (options?.signal?.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }
    try {
      return await getMatchResults(roomId, {
        viewerPlayerId: viewerPlayerId ?? undefined,
        signal: options?.signal,
      });
    } catch (e) {
      lastErr = e;
      if (
        e instanceof ApiError &&
        e.code === "conflict" &&
        e.message === MATCH_NOT_FINISHED &&
        i < maxAttempts - 1
      ) {
        await delay(delayMs);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
