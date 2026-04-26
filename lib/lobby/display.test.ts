import { describe, expect, it } from "vitest";
import { getLobbyLeaderPlayerId } from "@/lib/lobby";

const p = (id: string, opts?: { is_leader?: boolean }) => ({
  player_id: id,
  ...opts,
});

describe("getLobbyLeaderPlayerId", () => {
  it("uses roster is_leader when set", () => {
    expect(
      getLobbyLeaderPlayerId({
        id: "l1",
        players: [p("guest"), p("host", { is_leader: true })],
        status: "w",
        leader_player_id: "guest",
      }),
    ).toBe("host");
  });

  it("uses leader_player_id when no roster flag", () => {
    expect(
      getLobbyLeaderPlayerId({
        id: "l1",
        players: [p("b"), p("a")],
        status: "w",
        leader_player_id: "a",
      }),
    ).toBe("a");
  });

  it("uses host_player_id when leader_player_id is absent", () => {
    expect(
      getLobbyLeaderPlayerId({
        id: "l1",
        players: [p("x")],
        status: "w",
        host_player_id: "host-1",
      }),
    ).toBe("host-1");
  });

  it("falls back to first player in roster", () => {
    expect(
      getLobbyLeaderPlayerId({
        id: "l1",
        players: [p("first"), p("second")],
        status: "w",
      }),
    ).toBe("first");
  });

  it("returns null for empty lobby", () => {
    expect(getLobbyLeaderPlayerId(null)).toBeNull();
    expect(
      getLobbyLeaderPlayerId({ id: "l1", players: [], status: "w" }),
    ).toBeNull();
  });
});
