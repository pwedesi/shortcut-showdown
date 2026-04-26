import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsClient } from "@/app/results/ResultsClient";
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
const rematchApi = vi.fn();

vi.mock("@/lib/results/fetchMatchResultsWithRetry", () => ({
  fetchMatchResultsWithRetry: (...args: unknown[]) => fetchResults(...args),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, createRematch: (...a: unknown[]) => rematchApi(...a) };
});

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
    rematchApi.mockReset();
    searchParams = new URLSearchParams("room=room-a&player=p1");
    fetchResults.mockResolvedValue(sampleResults);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders podium and telemetry from session data", async () => {
    render(<ResultsClient />);
    await waitFor(() => {
      expect(screen.getByText("First")).toBeInTheDocument();
    });
    expect(screen.getByText("52 WPM")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
  });

  it("navigates to rematch lobby on success", async () => {
    rematchApi.mockResolvedValue({
      room_id: "room-a",
      next_lobby_id: "lobby-new",
    });
    render(<ResultsClient />);
    await waitFor(() => screen.findByRole("button", { name: /rematch/i }));
    await userEvent.click(screen.getByRole("button", { name: /rematch/i }));
    await waitFor(() => {
      expect(rematchApi).toHaveBeenCalledWith("room-a", { player_id: "p1" });
      expect(push).toHaveBeenCalledWith("/lobby?id=lobby-new");
    });
  });

  it("shows rematch failure and allows new lobby path", async () => {
    rematchApi.mockRejectedValue(
      new ApiError("rematch_roster_changed", {
        code: "conflict",
        status: 409,
      }),
    );
    render(<ResultsClient />);
    await waitFor(() => screen.findByRole("button", { name: /rematch/i }));
    await userEvent.click(screen.getByRole("button", { name: /rematch/i }));
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
    render(<ResultsClient />);
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
    fetchResults.mockReset();
    rematchApi.mockReset();
    searchParams = new URLSearchParams("room=room-a&player=p1");
  });

  it("fetches results again when room query changes", async () => {
    fetchResults.mockResolvedValue(sampleResults);
    const { rerender } = render(<ResultsClient />);
    await waitFor(() => expect(fetchResults).toHaveBeenCalledTimes(1));
    searchParams = new URLSearchParams("room=room-b&player=p1");
    rerender(<ResultsClient />);
    await waitFor(() => expect(fetchResults).toHaveBeenCalledTimes(2));
  });
});
