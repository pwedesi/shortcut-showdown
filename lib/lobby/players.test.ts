import { describe, expect, it } from "vitest";
import {
  lobbyHasPlayer,
  lobbyPlayerEntryToId,
  normalizeLobbyFromApi,
} from "@/lib/lobby";

describe("lobbyPlayers", () => {
  it("lobbyPlayerEntryToId accepts strings and common object shapes", () => {
    expect(lobbyPlayerEntryToId("abc")).toBe("abc");
    expect(lobbyPlayerEntryToId(42)).toBe("42");
    expect(lobbyPlayerEntryToId({ player_id: "p1" })).toBe("p1");
    expect(lobbyPlayerEntryToId({ id: "p2" })).toBe("p2");
    expect(lobbyPlayerEntryToId({})).toBeNull();
    expect(lobbyPlayerEntryToId(null)).toBeNull();
  });

  it("normalizeLobbyFromApi maps rich roster entries", () => {
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: [
          {
            player_id: "u1",
            display_name: "OPERATOR_01",
            is_leader: true,
          },
          {
            player_id: "u2",
            display_name: "guest",
            is_leader: false,
          },
        ],
        status: "full",
      }),
    ).toEqual({
      id: "lob-1",
      players: [
        {
          player_id: "u1",
          display_name: "OPERATOR_01",
          is_leader: true,
        },
        {
          player_id: "u2",
          display_name: "guest",
        },
      ],
      status: "full",
    });
  });

  it("normalizeLobbyFromApi maps object players without display_name", () => {
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: [{ player_id: "u1" }, { player_id: "u2" }],
        status: "waiting",
      }),
    ).toEqual({
      id: "lob-1",
      players: [{ player_id: "u1" }, { player_id: "u2" }],
      status: "waiting",
    });
  });

  it("normalizeLobbyFromApi keeps string players as roster", () => {
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: ["a", "b"],
        status: "open",
        code: "  xyz  ",
        max_players: 4,
      }),
    ).toEqual({
      id: "lob-1",
      players: [{ player_id: "a" }, { player_id: "b" }],
      status: "open",
      code: "xyz",
      max_players: 4,
    });
  });

  it("normalizeLobbyFromApi passes through leader ids", () => {
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: ["p1"],
        status: "waiting",
        leader_player_id: " p1 ",
        host_player_id: "ignored-if-leader-set",
      }),
    ).toMatchObject({
      leader_player_id: "p1",
      host_player_id: "ignored-if-leader-set",
      players: [{ player_id: "p1" }],
    });
  });

  it("normalizeLobbyFromApi passes through match settings", () => {
    expect(
      normalizeLobbyFromApi({
        id: "K7M4QZ1",
        status: "waiting",
        players: [],
        challenge_count: 10,
        round_duration_seconds: 90,
        max_attempts_per_second: 8,
      }),
    ).toEqual({
      id: "K7M4QZ1",
      status: "waiting",
      players: [],
      challenge_count: 10,
      round_duration_seconds: 90,
      max_attempts_per_second: 8,
    });
  });

  it("normalizeLobbyFromApi maps game room id aliases to game_room_id", () => {
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: ["a"],
        status: "in_game",
        active_game_room_id: "r2",
      }),
    ).toMatchObject({ id: "lob-1", game_room_id: "r2" });
    expect(
      normalizeLobbyFromApi({
        id: "lob-1",
        players: ["a"],
        status: "in_game",
        game_room_id: "r1",
        room_id: "ignored",
      }),
    ).toMatchObject({ game_room_id: "r1" });
  });

  it("lobbyHasPlayer", () => {
    const lobby = normalizeLobbyFromApi({
      id: "l",
      players: [{ player_id: "a" }, { player_id: "b" }],
      status: "w",
    });
    expect(lobbyHasPlayer(lobby, "a")).toBe(true);
    expect(lobbyHasPlayer(lobby, "c")).toBe(false);
    expect(lobbyHasPlayer(null, "a")).toBe(false);
  });
});
