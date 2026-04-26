import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameplayClient } from "@/app/gameplay/GameplayClient";
import { PlayerConnectionProvider } from "@/lib/realtime/playerConnection";

const replace = vi.fn();
const ROOM = "room-gameplay-test";

const playerWsId = "p-gameplay-ws";

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

  send() {}
}

let searchParams: URLSearchParams;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => "http://test.local",
  getWebSocketFullUrl: () => "ws://test/ws",
}));

function gameRoomJson() {
  return {
    id: ROOM,
    players: [playerWsId],
    locked: true,
    game_state: {
      status: "running",
      state_version: 1,
      server_time: 1000,
      round_started_at: 900,
      round_ends_at: 2000,
      objective_count: 10,
      challenges: [{ index: 0, prompt: "Copy selected text" }],
      players: {
        [playerWsId]: {
          objective_index: 0,
          progress_percent: 12,
          wpm: 40,
          accuracy: 90,
          streak: 1,
          attempts_total: 1,
          attempts_correct: 1,
          finished: false,
          finished_at: null,
        },
      },
      finished: false,
      winner_player_id: null,
      draw: false,
      end_reason: null,
      finished_at: null,
    },
  };
}

describe("GameplayClient", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    replace.mockReset();
    MockWebSocket.instances = [];
    searchParams = new URLSearchParams(`room=${ROOM}`);
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        if (u.includes(`/game-rooms/${encodeURIComponent(ROOM)}`) && !u.includes("attempts")) {
          return new Response(JSON.stringify(gameRoomJson()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("bad", { status: 500 });
      }),
    );
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
    vi.unstubAllGlobals();
  });

  it("loads room and shows server prompt", async () => {
    render(
      <PlayerConnectionProvider>
        <GameplayClient />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Copy selected text/i)).toBeInTheDocument();
    });
  });

  it("posts attempt with ctrl+c keys", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
      const u = String(input);
      if (u.includes(`/game-rooms/${encodeURIComponent(ROOM)}/attempts`)) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        expect(body.keys).toEqual(["ctrl", "c"]);
        return new Response(
          JSON.stringify({
            room_id: ROOM,
            player_id: playerWsId,
            accepted: true,
            reason: null,
            correct: true,
            objective_index: 1,
            state_version: 2,
            game_state: {
              ...gameRoomJson().game_state,
              state_version: 2,
              players: {
                [playerWsId]: {
                  ...gameRoomJson().game_state.players[playerWsId],
                  objective_index: 1,
                },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (u.includes(`/game-rooms/${encodeURIComponent(ROOM)}`) && !u.includes("attempts")) {
        return new Response(JSON.stringify(gameRoomJson()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("bad", { status: 500 });
    });

    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      <PlayerConnectionProvider>
        <GameplayClient />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/Type the shortcut/i)).toBeInTheDocument();
    });
    const input = screen.getByLabelText(/Type the shortcut/i);
    input.focus();
    await user.keyboard("{Control>}c{/Control}");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/attempts"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
