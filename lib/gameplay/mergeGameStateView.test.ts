import { describe, expect, it } from "vitest";
import type { GameStateView } from "@/lib/api/types";
import { mergeGameStateView } from "@/lib/gameplay/mergeGameStateView";

const base: GameStateView = {
  status: "running",
  state_version: 1,
  server_time: 0,
  round_started_at: 0,
  round_ends_at: 100,
  objective_count: 1,
  challenges: [],
  players: {},
  finished: false,
  winner_player_id: null,
  draw: false,
  end_reason: null,
  finished_at: null,
};

describe("mergeGameStateView", () => {
  it("keeps higher state_version", () => {
    const next: GameStateView = { ...base, state_version: 3 };
    const out = mergeGameStateView(
      { ...base, state_version: 2 },
      next,
    );
    expect(out.state_version).toBe(3);
  });

  it("ignores stale lower state_version", () => {
    const prev: GameStateView = { ...base, state_version: 5 };
    const out = mergeGameStateView(prev, { ...base, state_version: 2 });
    expect(out.state_version).toBe(5);
  });
});
