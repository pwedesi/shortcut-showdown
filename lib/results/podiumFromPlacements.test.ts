import { describe, expect, it } from "vitest";
import type { MatchPlacementView, MatchResultsView } from "@/lib/api/types";
import {
  findPlacementForPlayer,
  initialsFromDisplayName,
  podiumRowsInVisualOrder,
  resultsOutcomeHeadline,
  resultsOutcomeSubcopy,
  topPlacements,
} from "@/lib/results/podiumFromPlacements";

function placement(
  overrides: Partial<MatchPlacementView> & { player_id: string; place: number },
): MatchPlacementView {
  return {
    display_name: overrides.display_name ?? overrides.player_id,
    objective_index: 0,
    progress_percent: 0,
    wpm: 0,
    accuracy: 0,
    streak: 0,
    attempts_total: 0,
    attempts_correct: 0,
    finished: false,
    finished_at: null,
    ...overrides,
  };
}

describe("podiumFromPlacements", () => {
  it("orders top three by place", () => {
    const rows = [
      placement({ player_id: "c", place: 3, wpm: 10 }),
      placement({ player_id: "a", place: 1, wpm: 30 }),
      placement({ player_id: "b", place: 2, wpm: 20 }),
    ];
    const top = topPlacements(rows);
    expect(top.map((p) => p.player_id)).toEqual(["a", "b", "c"]);
  });

  it("lays out podium 2-1-3 for display", () => {
    const rows = [
      placement({
        player_id: "a",
        place: 1,
        display_name: "Alpha",
        wpm: 55.2,
      }),
      placement({ player_id: "b", place: 2, display_name: "Beta", wpm: 44 }),
      placement({ player_id: "c", place: 3, display_name: "Gamma", wpm: 33 }),
    ];
    const visual = podiumRowsInVisualOrder(rows, "b");
    expect(visual.map((v) => v.place)).toEqual([2, 1, 3]);
    expect(visual.find((v) => v.place === 2)?.highlighted).toBe(true);
    expect(visual.find((v) => v.place === 1)?.highlighted).toBe(false);
  });

  it("builds initials from two-word display names", () => {
    expect(initialsFromDisplayName("Neo Byte", "x")).toBe("NB");
  });

  it("finds viewer placement", () => {
    const rows = [
      placement({ player_id: "a", place: 1 }),
      placement({ player_id: "b", place: 2 }),
    ];
    expect(findPlacementForPlayer(rows, "b")?.place).toBe(2);
    expect(findPlacementForPlayer(rows, null)).toBeNull();
  });

  it("headline reflects draw", () => {
    const r: MatchResultsView = {
      room_id: "r1",
      you_player_id: null,
      placements: [],
      winner_player_id: null,
      draw: true,
      end_reason: "time",
      ended_at: 1,
      finished: true,
    };
    expect(resultsOutcomeHeadline(r)).toBe("DRAW");
    expect(resultsOutcomeSubcopy(r)).toContain("heat");
  });

  it("headline names winner", () => {
    const r: MatchResultsView = {
      room_id: "r1",
      you_player_id: null,
      placements: [
        placement({
          player_id: "w",
          place: 1,
          display_name: "Winner",
        }),
      ],
      winner_player_id: "w",
      draw: false,
      end_reason: "goal",
      ended_at: 1,
      finished: true,
    };
    expect(resultsOutcomeHeadline(r)).toBe("WINNER: Winner");
  });
});
