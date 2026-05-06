import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/types";

const { getMatchResultsMock } = vi.hoisted(() => ({
  getMatchResultsMock: vi.fn(),
}));

vi.mock("@/lib/api/gameRooms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/gameRooms")>();
  return { ...actual, getMatchResults: getMatchResultsMock };
});

import { fetchMatchResultsWithRetry } from "@/lib/results/fetchMatchResultsWithRetry";

const resultsBody = {
  room_id: "room-1",
  you_player_id: "p1",
  placements: [],
  winner_player_id: "p1",
  draw: false,
  end_reason: "goal" as const,
  ended_at: 1,
  finished: true,
};

describe("fetchMatchResultsWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getMatchResultsMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on match_not_finished then succeeds", async () => {
    getMatchResultsMock
      .mockRejectedValueOnce(
        new ApiError("match_not_finished", {
          code: "conflict",
          status: 409,
        }),
      )
      .mockResolvedValueOnce(resultsBody);

    const p = fetchMatchResultsWithRetry("room-1", "p1", {
      delayMs: 100,
      attempts: 4,
    });
    const settled = expect(p).resolves.toMatchObject({ room_id: "room-1" });
    await vi.advanceTimersByTimeAsync(150);
    await settled;
    expect(getMatchResultsMock).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    getMatchResultsMock.mockRejectedValue(
      new ApiError("match_not_finished", {
        code: "conflict",
        status: 409,
      }),
    );

    const p = fetchMatchResultsWithRetry("room-1", null, {
      delayMs: 10,
      attempts: 3,
    });
    const settled = expect(p).rejects.toMatchObject({
      message: "match_not_finished",
    });
    await vi.advanceTimersByTimeAsync(50);
    await settled;
    expect(getMatchResultsMock).toHaveBeenCalledTimes(3);
  });
});
