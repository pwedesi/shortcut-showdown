import type { MatchPlacementView, MatchResultsView } from "@/lib/api/types";

export type PodiumRow = {
  place: 1 | 2 | 3;
  name: string;
  wpm: number;
  initials: string;
  highlighted: boolean;
};

export function initialsFromDisplayName(
  displayName: string,
  playerId: string,
): string {
  const raw = displayName.trim() || playerId;
  const parts = raw.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 2) {
    return compact.slice(0, 2).toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase() || "??";
}

/** Top N placements by `place` ascending (1 = best). */
export function topPlacements(
  placements: MatchPlacementView[],
  max = 3,
): MatchPlacementView[] {
  return [...placements]
    .filter((p) => p.place >= 1 && p.place <= max)
    .sort((a, b) => a.place - b.place)
    .slice(0, max);
}

/**
 * Order for the three-column podium UI: 2nd, 1st, 3rd (left to right).
 * Omits missing ranks (e.g. two-player match).
 */
export function podiumRowsInVisualOrder(
  placements: MatchPlacementView[],
  youPlayerId: string | null,
): PodiumRow[] {
  const top = topPlacements(placements, 3);
  const byPlace = new Map(top.map((p) => [p.place, p]));
  const visualOrder: (1 | 2 | 3)[] = [2, 1, 3];
  const rows: PodiumRow[] = [];
  for (const place of visualOrder) {
    const p = byPlace.get(place);
    if (!p) continue;
    rows.push({
      place: place as 1 | 2 | 3,
      name: p.display_name || p.player_id,
      wpm: Math.round(p.wpm),
      initials: initialsFromDisplayName(p.display_name, p.player_id),
      highlighted: youPlayerId !== null && p.player_id === youPlayerId,
    });
  }
  return rows;
}

export function findPlacementForPlayer(
  placements: MatchPlacementView[],
  playerId: string | null,
): MatchPlacementView | null {
  if (!playerId) return null;
  return placements.find((p) => p.player_id === playerId) ?? null;
}

export function resultsOutcomeHeadline(results: MatchResultsView): string {
  if (results.draw) {
    return "DRAW";
  }
  if (results.winner_player_id && results.placements.length > 0) {
    const w = results.placements.find(
      (p) => p.player_id === results.winner_player_id,
    );
    if (w) {
      return `WINNER: ${w.display_name || w.player_id}`;
    }
  }
  return "RACE COMPLETE";
}

export function resultsOutcomeSubcopy(results: MatchResultsView): string {
  if (results.draw) {
    return "Dead heat — same rank criteria";
  }
  switch (results.end_reason) {
    case "goal":
      return "Finished objective line";
    case "time":
      return "Time expired";
    case "forfeit":
      return "Match ended early";
    default:
      return "Session telemetry";
  }
}
