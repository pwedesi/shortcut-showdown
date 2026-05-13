import { describe, expect, it } from "vitest";
import type { GameStateView } from "@/lib/api/types";
import { remainingRoundSeconds } from "@/lib/gameplay/remainingSeconds";

const gs: GameStateView = {
  status: "running",
  state_version: 1,
  server_time: 100,
  round_ends_at: 190,
  round_started_at: 0,
  objective_count: 1,
  challenges: [],
  players: {},
  finished: false,
  winner_player_id: null,
  draw: false,
  end_reason: null,
  finished_at: null,
};

describe("remainingRoundSeconds", () => {
  it("counts down with wall clock", () => {
    const at = 1000;
    const r0 = remainingRoundSeconds(gs, at, at);
    expect(r0).toBe(90);
    const r1 = remainingRoundSeconds(gs, at, at + 10_000);
    expect(r1).toBe(80);
  });
});
