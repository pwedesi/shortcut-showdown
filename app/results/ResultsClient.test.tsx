import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsClient } from "@/app/results/ResultsClient";
import { PlayerConnectionProvider } from "@/lib/realtime/playerConnection";
import type { MatchResultsView } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

const push = vi.fn();
const replace = vi.fn();

let searchParams = new URLSearchParams("room=room-a&player=p1");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

const fetchResults = vi.fn();
const acceptRematchApi = vi.fn();
const declineRematchApi = vi.fn();

vi.mock("@/lib/config", () => ({
  getWebSocketFullUrl: () => "ws://test/ws",
}));

vi.mock("@/lib/results/fetchMatchResultsWithRetry", () => ({
  fetchMatchResultsWithRetry: (...args: unknown[]) => fetchResults(...args),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    acceptRematch: (...a: unknown[]) => acceptRematchApi(...a),
    declineRematch: (...a: unknown[]) => declineRematchApi(...a),
  };
});

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
      this.emit({ type: "connect", payload: { player_id: "p1" } });
    });
  }

  send() {}

  close() {
    this.readyState = 3;
  }

  emit(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

const OriginalWebSocket = globalThis.WebSocket;

function renderClient() {
  return render(
    <PlayerConnectionProvider>
      <ResultsClient />
    </PlayerConnectionProvider>,
  );
}

const sampleResults: MatchResultsView = {
  room_id: "room-a",
  you_player_id: "p1",
  placements: [
    {
      player_id: "p2",
      display_name: "Second",
      place: 2,
      objective_index: 5,
      progress_percent: 50,
      wpm: 40,
      accuracy: 90,
      streak: 1,
      attempts_total: 6,
      attempts_correct: 5,
      finished: false,
      finished_at: null,
    },
    {
      player_id: "p1",
      display_name: "First",
      place: 1,
      objective_index: 10,
      progress_percent: 100,
      wpm: 52,
      accuracy: 94,
      streak: 3,
      attempts_total: 11,
      attempts_correct: 10,
      finished: true,
      finished_at: 100,
    },
    {
      player_id: "p3",
      display_name: "Third",
      place: 3,
      objective_index: 2,
      progress_percent: 20,
      wpm: 30,
      accuracy: 80,
      streak: 0,
      attempts_total: 3,
      attempts_correct: 2,
      finished: false,
      finished_at: null,
    },
  ],
  winner_player_id: "p1",
  draw: false,
  end_reason: "goal",
  ended_at: 100,
  finished: true,
};

describe("ResultsClient", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    fetchResults.mockReset();
    acceptRematchApi.mockReset();
    declineRematchApi.mockReset();
    searchParams = new URLSearchParams("room=room-a&player=p1");
    fetchResults.mockResolvedValue(sampleResults);
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.WebSocket = OriginalWebSocket;
  });

  it("renders podium and telemetry from session data", async () => {
    renderClient();
    await waitFor(() => {
      expect(screen.getByText("First")).toBeInTheDocument();
    });
    expect(screen.getByText("52 WPM")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
  });

  it("navigates to rematch lobby on success", async () => {
    acceptRematchApi.mockResolvedValue({
      room_id: "room-a",
      accepted_by: ["p1"],
      pending_players: [],
      all_accepted: true,
    });
    renderClient();
    await waitFor(() => screen.findByRole("button", { name: /accept/i }));
    await userEvent.click(screen.getByRole("button", { name: /accept/i }));
    await waitFor(() => {
      expect(acceptRematchApi).toHaveBeenCalledWith("room-a", { player_id: "p1" });
    });

    const ws = MockWebSocket.instances.at(-1);
    ws?.emit({ type: "rematch_ready", payload: { next_lobby_id: "lobby-new" } });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/lobby?id=lobby-new");
    });
  });

  it("shows rematch failure and allows new lobby path", async () => {
    acceptRematchApi.mockRejectedValue(
      new ApiError("rematch_roster_changed", {
        code: "conflict",
        status: 409,
      }),
    );
    renderClient();
    await waitFor(() => screen.findByRole("button", { name: /accept/i }));
    await userEvent.click(screen.getByRole("button", { name: /accept/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/player left the match/i),
      ).toBeInTheDocument();
    });
  });

  it("new lobby goes home and clears continuity", async () => {
    const clear = vi.spyOn(
      await import("@/lib/session/resultsContext"),
      "clearPersistedResultsContext",
    );
    renderClient();
    await waitFor(() => screen.findByRole("button", { name: /new lobby/i }));
    await userEvent.click(screen.getByRole("button", { name: /new lobby/i }));
    expect(clear).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
    clear.mockRestore();
  });
});

describe("ResultsClient journey — reload results after rematch cycle", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    fetchResults.mockReset();
    acceptRematchApi.mockReset();
    declineRematchApi.mockReset();
    searchParams = new URLSearchParams("room=room-a&player=p1");
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket;
  });

  it("fetches results again when room query changes", async () => {
    fetchResults.mockResolvedValue(sampleResults);
    const { rerender } = renderClient();
    await waitFor(() => expect(fetchResults).toHaveBeenCalledTimes(1));
    searchParams = new URLSearchParams("room=room-b&player=p1");
    rerender(
      <PlayerConnectionProvider>
        <ResultsClient />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => expect(fetchResults).toHaveBeenCalledTimes(2));
  });
});
