import type { GameStateView } from "@/lib/api/types";

/**
 * Estimated whole seconds left in the round using the last server snapshot
 * and local wall clock drift.
 */
export function remainingRoundSeconds(
  gameState: GameStateView,
  wallMsAtSync: number,
  nowMs: number = Date.now(),
): number {
  const elapsed = (nowMs - wallMsAtSync) / 1000;
  const nowServer = gameState.server_time + elapsed;
  return Math.max(0, Math.ceil(gameState.round_ends_at - nowServer));
}
