import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PlayerConnectionProvider,
  usePlayerConnection,
} from "@/lib/realtime/playerConnection";

vi.mock("@/lib/config", () => ({
  getWebSocketFullUrl: () => "ws://test/ws",
}));

type OnClose = ((ev: CloseEvent) => void) | null;

let randomSpy: ReturnType<typeof vi.spyOn> | null = null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: OnClose = null;

  constructor(readonly _url: string) {
    MockWebSocket.instances.push(this);
    const n = MockWebSocket.instances.length;
    queueMicrotask(() => {
      this.onopen?.();
      if (n === 1) {
        queueMicrotask(() => {
          this.onclose?.(new MockCloseEvent(false));
        });
      } else {
        this.onmessage?.({
          data: JSON.stringify({ event: "connect", player_id: "p-after-retry" }),
        });
      }
    });
  }

  close() {
    this.onclose?.(new MockCloseEvent(true));
  }
}

class MockCloseEvent {
  wasClean: boolean;
  constructor(wasClean: boolean) {
    this.wasClean = wasClean;
  }
}

function StateProbe() {
  const { status, playerId, reconnect, lastError } = usePlayerConnection();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="player-id">{playerId ?? "none"}</span>
      <span data-testid="last-err">{lastError ?? ""}</span>
      <button type="button" onClick={reconnect}>
        reconnect
      </button>
    </div>
  );
}

describe("PlayerConnectionProvider reconnect", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
    randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
    vi.useRealTimers();
    randomSpy?.mockRestore();
    randomSpy = null;
    vi.unstubAllGlobals();
  });

  it("schedules retry after first socket closes before connect message and eventually connects", async () => {
    render(
      <PlayerConnectionProvider>
        <StateProbe />
      </PlayerConnectionProvider>,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("reconnecting");
    });
    await act(async () => {
      const delayMs = 15_200;
      await vi.advanceTimersByTimeAsync(delayMs);
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("connected");
    });
    expect(screen.getByTestId("player-id").textContent).toBe("p-after-retry");
  });

  it("reconnect() is callable while reconnecting and completes connection", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      <PlayerConnectionProvider>
        <StateProbe />
      </PlayerConnectionProvider>,
    );
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("reconnecting");
    });
    await user.click(screen.getByRole("button", { name: /reconnect/i }));
    await act(async () => {
      const delayMs = 15_200;
      await vi.advanceTimersByTimeAsync(delayMs);
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("connected");
    });
  });
});
