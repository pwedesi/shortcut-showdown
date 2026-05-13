import type { GameStateView } from "@/lib/api/types";

/** Apply an incoming snapshot; keep the numerically higher `state_version`. */
export function mergeGameStateView(
  previous: GameStateView | null,
  incoming: GameStateView,
): GameStateView {
  if (previous === null) {
    return incoming;
  }
  if (incoming.state_version < previous.state_version) {
    return previous;
  }
  return incoming;
}
