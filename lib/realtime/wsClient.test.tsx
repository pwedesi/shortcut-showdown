import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  PlayerConnectionProvider,
  usePlayerConnection,
} from "@/lib/realtime/playerConnection";

vi.mock("@/lib/config", () => ({
  getWebSocketFullUrl: () => "ws://test/ws",
}));

type Handler = (() => void) | null;
type MsgHandler = ((ev: { data: string }) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: Handler = null;
  onmessage: MsgHandler = null;
  onerror: Handler = null;
  onclose: ((ev: { wasClean: boolean }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
      this.onmessage?.({
        data: JSON.stringify({ event: "connect", player_id: "player-ws-1" }),
      });
    });
  }

  close() {
    this.readyState = 3;
  }
}

function Probe() {
  const { status, playerId, reconnect } = usePlayerConnection();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="pid">{playerId ?? "none"}</span>
      <button type="button" onClick={reconnect}>
        reconnect
      </button>
    </div>
  );
}

describe("PlayerConnectionProvider", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });
  afterEach(() => {
    globalThis.WebSocket = Original;
  });

  it("receives player_id from first WS message", async () => {
    render(
      <PlayerConnectionProvider>
        <Probe />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("connected");
    });
    expect(screen.getByTestId("pid").textContent).toBe("player-ws-1");
  });
});
