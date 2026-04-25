import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { PlayerConnectionProvider } from "@/lib/realtime/playerConnection";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => "http://test.local",
  getWebSocketUrl: () => "ws://test",
  getWebSocketPath: () => "/ws",
  getWebSocketFullUrl: () => "ws://test/ws",
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
      this.onmessage?.({
        data: JSON.stringify({ event: "connect", player_id: "p-home" }),
      });
    });
  }

  close() {
    this.readyState = 3;
  }
}

function setupFetchCreateLobby() {
  vi.stubGlobal("fetch", vi.fn());
  vi.mocked(fetch).mockImplementation(async (input: RequestInfo) => {
    const u = String(input);
    if (u.startsWith("http://test.local/lobbies") && u.endsWith("/lobbies")) {
      return new Response(
        JSON.stringify({
          id: "lobby-1",
          players: ["p-home"],
          status: "waiting",
          code: "AX79",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  });
}

describe("Home create lobby", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    setupFetchCreateLobby();
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
  });

  it("navigates to lobby after create", async () => {
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Realtime connected")).toBeInTheDocument();
    });
    const createBtn = screen.getByRole("button", { name: /create lobby/i });
    await user.click(createBtn);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });
    expect(replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/lobby\?.*id=lobby-1/),
    );
  });
});
