import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRematch,
  getGameRoom,
  getMatchResults,
  submitGameAttempt,
} from "@/lib/api/gameRooms";

const ROOM_ID = "room-42";
const API = "http://test.local";

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => API,
}));

const minimalState = {
  status: "running",
  state_version: 2,
  server_time: 1000,
  round_started_at: 0,
  round_ends_at: 2000,
  objective_count: 3,
  challenges: [{ index: 0, prompt: "Copy" }],
  players: {
    p1: {
      objective_index: 0,
      progress_percent: 0,
      wpm: 0,
      accuracy: 100,
      streak: 0,
      attempts_total: 0,
      attempts_correct: 0,
      finished: false,
      finished_at: null,
    },
  },
  finished: false,
  winner_player_id: null,
  draw: false,
  end_reason: null,
  finished_at: null,
};

describe("game room API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getGameRoom GETs encoded path", async () => {
    const view = {
      id: ROOM_ID,
      players: ["p1"],
      locked: true,
      game_state: minimalState,
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(view), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await getGameRoom(ROOM_ID);
    expect(out.id).toBe(ROOM_ID);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/game-rooms/${encodeURIComponent(ROOM_ID)}`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("submitGameAttempt POSTs JSON body", async () => {
    const resBody = {
      room_id: ROOM_ID,
      player_id: "p1",
      accepted: true,
      reason: null,
      correct: true,
      objective_index: 1,
      state_version: 3,
      game_state: { ...minimalState, state_version: 3 },
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(resBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await submitGameAttempt(ROOM_ID, {
      player_id: "p1",
      objective_index: 0,
      keys: ["ctrl", "c"],
      attempt_id: "a1",
    });
    expect(out.accepted).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/game-rooms/${encodeURIComponent(ROOM_ID)}/attempts`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          player_id: "p1",
          objective_index: 0,
          keys: ["ctrl", "c"],
          attempt_id: "a1",
        }),
      }),
    );
  });

  it("getMatchResults GETs with optional player_id query", async () => {
    const body = {
      room_id: ROOM_ID,
      you_player_id: "p1",
      placements: [],
      winner_player_id: "p1",
      draw: false,
      end_reason: "goal",
      ended_at: 1,
      finished: true,
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await getMatchResults(ROOM_ID, { viewerPlayerId: "p1" });
    expect(out.room_id).toBe(ROOM_ID);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/game-rooms/${encodeURIComponent(ROOM_ID)}/results?player_id=p1`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createRematch POSTs player_id", async () => {
    const body = { room_id: ROOM_ID, next_lobby_id: "lobby-next" };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await createRematch(ROOM_ID, { player_id: "p1" });
    expect(out.next_lobby_id).toBe("lobby-next");
    expect(fetch).toHaveBeenCalledWith(
      `${API}/game-rooms/${encodeURIComponent(ROOM_ID)}/rematch`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ player_id: "p1" }),
      }),
    );
  });
});
