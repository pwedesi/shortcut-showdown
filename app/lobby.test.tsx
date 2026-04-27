import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LobbyPage from "@/app/lobby/page";
import { PlayerConnectionProvider } from "@/lib/realtime/playerConnection";

const LOBBY_ID =
  "7d8d9a0e-0b0c-4c5d-8e9f-0a1b2c3d4e5f";

const push = vi.fn();
const replace = vi.fn();

const playerWsId = "p-lobby-test";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    if (!String(url).includes("/ws")) {
      throw new Error("unexpected url");
    }
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.onopen?.();
      this.onmessage?.({
        data: JSON.stringify({
          event: "connect",
          player_id: playerWsId,
        }),
      });
    });
  }

  close() {
    this.onclose?.();
  }
}

let searchParams: URLSearchParams;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => "http://test.local",
  getWebSocketUrl: () => "ws://test",
  getWebSocketPath: () => "/ws",
  getWebSocketFullUrl: () => "ws://test/ws",
}));

function fetchLobbySuccess(body: object) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Lobby page", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    searchParams = new URLSearchParams();
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows missing-lobby message when there is no id in the query", () => {
    searchParams = new URLSearchParams();
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    expect(
      screen.getByText(/Missing lobby\./, { exact: false }),
    ).toBeInTheDocument();
  });

  it(
    "refreshes lobby on an interval and updates occupancy text",
    async () => {
      searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
      let getCalls = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo) => {
          const u = String(input);
          if (u.includes("/players/")) {
            return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
          }
          if (
            u.startsWith("http://test.local/lobbies/") &&
            u.includes(LOBBY_ID) &&
            !u.match(/join|leave|start/)
          ) {
            getCalls += 1;
            const n = getCalls;
            return fetchLobbySuccess({
              id: LOBBY_ID,
              players: n === 1 ? [playerWsId] : [playerWsId, "p-other"],
              status: "waiting",
              max_players: 2,
            });
          }
          return new Response("unexpected", { status: 500 });
        }),
      );

      render(
        <PlayerConnectionProvider>
          <LobbyPage />
        </PlayerConnectionProvider>,
      );

      await waitFor(
        () => {
          expect(screen.getByText(/1\/2 CONNECTED/)).toBeInTheDocument();
        },
        { timeout: 5_000 },
      );
      await act(async () => {
        await new Promise<void>((r) => setTimeout(r, 3_200));
      });
      await waitFor(
        () => {
          expect(screen.getByText(/2\/2 CONNECTED/)).toBeInTheDocument();
        },
        { timeout: 5_000 },
      );
    },
    10_000,
  );

  it("shows friendly fetch error when GET lobby fails", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (u.includes("/lobbies/") && !u.match(/join|leave|start/)) {
          return new Response(JSON.stringify({ detail: "nope" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("unexpected", { status: 500 });
      }),
    );

    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No lobby found with that code/),
      ).toBeInTheDocument();
    });
  });

  it("shows waiting message when there is no player id yet (disconnected handoff)", async () => {
    class NoIdSocket {
      onopen: (() => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor() {
        queueMicrotask(() => {
          this.onopen?.();
        });
      }
    }
    globalThis.WebSocket = NoIdSocket as unknown as typeof WebSocket;
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            players: [playerWsId],
            status: "waiting",
          });
        }
        return new Response("unexpected", { status: 500 });
      }),
    );

    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Waiting for player id from the server/,
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows ready action slot for a guest when the host is another player", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            status: "waiting",
            players: [
              {
                player_id: "p-host",
                display_name: "HOST",
                is_leader: true,
              },
              {
                player_id: playerWsId,
                display_name: "guest",
                is_leader: false,
              },
            ],
          });
        }
        return new Response("bad", { status: 500 });
      }),
    );
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    const readyBtn = await screen.findByRole("button", {
      name: /mark ready/i,
    });
    expect(readyBtn).toBeInTheDocument();
    expect(
      await screen.findByText(/Mark ready when you are set/i),
    ).toBeInTheDocument();
  });

  it("disables host start when a non-leader is not ready", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({
            player_id: playerWsId,
            display_name: "HOST",
            is_ready: false,
          });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            status: "waiting",
            players: [
              {
                player_id: playerWsId,
                display_name: "HOST",
                is_leader: true,
                is_ready: false,
              },
              {
                player_id: "p-guest",
                display_name: "GUEST",
                is_leader: false,
                is_ready: false,
              },
            ],
          });
        }
        return new Response("bad", { status: 500 });
      }),
    );

    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );

    const startBtn = await screen.findByRole("button", {
      name: /initiate launch/i,
    });
    expect(startBtn).toBeDisabled();
    expect(
      await screen.findByText(/Waiting for all non-leader players to mark ready/i),
    ).toBeInTheDocument();
  });

  it("navigates a non-leader to gameplay when GET lobby returns game_room_id", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    let getCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          getCalls += 1;
          if (getCalls === 1) {
            return fetchLobbySuccess({
              id: LOBBY_ID,
              status: "waiting",
              players: [
                { player_id: "p-host", is_leader: true },
                { player_id: playerWsId, is_leader: false },
              ],
            });
          }
          return fetchLobbySuccess({
            id: LOBBY_ID,
            status: "in_game",
            game_room_id: "room-from-poll",
            players: [
              { player_id: "p-host", is_leader: true },
              { player_id: playerWsId, is_leader: false },
            ],
          });
        }
        return new Response("bad", { status: 500 });
      }),
    );
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    await waitFor(
      () => {
        expect(screen.getByText(/2\/8 CONNECTED/)).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
    await act(async () => {
      await new Promise<void>((r) => setTimeout(r, 3_200));
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/room=room-from-poll/),
      );
    });
  });

  it("navigates a non-leader to gameplay on room_snapshot WebSocket event", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            status: "waiting",
            players: [
              { player_id: "p-host", is_leader: true },
              { player_id: playerWsId, is_leader: false },
            ],
          });
        }
        return new Response("bad", { status: 500 });
      }),
    );
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    await waitFor(
      () => {
        expect(screen.getByText(/2\/8 CONNECTED/)).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
    const ws = MockWebSocket.instances.at(-1)!;
    const gs = {
      status: "running",
      state_version: 1,
      server_time: 0,
      round_started_at: 0,
      round_ends_at: 1,
      objective_count: 0,
      challenges: [],
      players: {},
      finished: false,
      winner_player_id: null,
      draw: false,
      end_reason: null,
      finished_at: null,
    };
    await act(async () => {
      ws.onmessage?.({
        data: JSON.stringify({
          v: 1,
          type: "room_snapshot",
          room_id: "room-ws-1",
          game_state: gs,
        }),
      });
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/room=room-ws-1/),
      );
    });
  });

  it("navigates to gameplay when start returns game room id", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            players: [playerWsId],
            status: "waiting",
          });
        }
        if (u.includes("/start")) {
          return new Response(
            JSON.stringify({
              id: "room-abc",
              players: [playerWsId],
              locked: true,
              game_state: {
                status: "running",
                state_version: 1,
                server_time: 0,
                round_started_at: 0,
                round_ends_at: 1,
                objective_count: 0,
                challenges: [],
                players: {},
                finished: false,
                winner_player_id: null,
                draw: false,
                end_reason: null,
                finished_at: null,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        return new Response("bad", { status: 500 });
      }),
    );
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    const startBtn = await screen.findByRole("button", {
      name: /initiate launch/i,
    });
    await user.click(startBtn);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/room=room-abc/),
      );
    });
  });

  it("leave posts to API and navigates home", async () => {
    searchParams = new URLSearchParams(`id=${LOBBY_ID}`);
    const leavePaths: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/players/")) {
          return fetchLobbySuccess({ player_id: playerWsId, display_name: "test" });
        }
        if (
          u.startsWith("http://test.local/lobbies/") &&
          u.includes(LOBBY_ID) &&
          !u.match(/join|leave|start/)
        ) {
          return fetchLobbySuccess({
            id: LOBBY_ID,
            players: [playerWsId],
            status: "waiting",
          });
        }
        if (u.includes("/leave")) {
          leavePaths.push(u);
          return new Response(null, { status: 204 });
        }
        return new Response("bad", { status: 500 });
      }),
    );
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <LobbyPage />
      </PlayerConnectionProvider>,
    );
    const leaveBtn = await screen.findByRole("button", { name: /^leave$/i });
    await user.click(leaveBtn);
    await waitFor(() => {
      expect(leavePaths.length).toBeGreaterThan(0);
      expect(push).toHaveBeenCalledWith("/");
    });
  });
});
