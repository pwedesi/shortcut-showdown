import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  startLobby,
} from "@/lib/api/lobbies";

const LOBBY_ID =
  "7d8d9a0e-0b0c-4c5d-8e9f-0a1b2c3d4e5f";
const API = "http://test.local";

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => API,
}));

describe("lobby API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createLobby posts JSON body to POST /lobbies", async () => {
    const lobbyJson = {
      id: LOBBY_ID,
      players: ["p1"],
      status: "waiting",
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(lobbyJson), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await createLobby({ player_id: "p1" });
    expect(out).toEqual(lobbyJson);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/lobbies`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ player_id: "p1" }),
      }),
    );
  });

  it("joinLobby posts to encoded path", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: LOBBY_ID,
          players: ["p1", "p2"],
          status: "waiting",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    await joinLobby(LOBBY_ID, { player_id: "p2" });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/lobbies/${encodeURIComponent(LOBBY_ID)}/join`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ player_id: "p2" }),
      }),
    );
  });

  it("leaveLobby accepts 204 with empty body", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await expect(
      leaveLobby(LOBBY_ID, { player_id: "p1" }),
    ).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/lobbies/${encodeURIComponent(LOBBY_ID)}/leave`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ player_id: "p1" }),
      }),
    );
  });

  it("startLobby returns room fields from JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ room_id: "room-99", other: 1 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const res = await startLobby(LOBBY_ID, { player_id: "p1" });
    expect(res.room_id).toBe("room-99");
    expect(fetch).toHaveBeenCalledWith(
      `${API}/lobbies/${encodeURIComponent(LOBBY_ID)}/start`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getLobby uses GET", async () => {
    const lobbyJson = {
      id: LOBBY_ID,
      players: ["p1"],
      status: "waiting",
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(lobbyJson), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await getLobby(LOBBY_ID);
    expect(out).toEqual(lobbyJson);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/lobbies/${encodeURIComponent(LOBBY_ID)}`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("joinLobby maps 409 to conflict", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "lobby full" }), { status: 409 }),
    );
    await expect(
      joinLobby(LOBBY_ID, { player_id: "p3" }),
    ).rejects.toMatchObject({ code: "conflict" });
  });
});
