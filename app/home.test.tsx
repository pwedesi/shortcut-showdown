import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  getAppDisplayVersion: () => "v 1.0.0",
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

const LOBBY_ID =
  "7d8d9a0e-0b0c-4c5d-8e9f-0a1b2c3d4e5f";

function setupFetchJoinok() {
  vi.stubGlobal("fetch", vi.fn());
  vi.mocked(fetch).mockImplementation(async (input: RequestInfo) => {
    const u = String(input);
    if (u.startsWith("http://test.local/lobbies") && u.endsWith("/lobbies")) {
      return new Response(
        JSON.stringify({
          id: "lobby-1",
          players: ["p-home"],
          status: "waiting",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (u.includes("/join") && u.includes(LOBBY_ID)) {
      return new Response(
        JSON.stringify({
          id: LOBBY_ID,
          players: ["p-home", "p2"],
          status: "waiting",
          code: "Z9",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  });
}

describe("Home join lobby", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    setupFetchJoinok();
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
  });

  it("navigates to lobby after join with full id", async () => {
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Realtime connected")).toBeInTheDocument();
    });
    const joinWithCode = await showJoinWithCode(user);
    const joinField = await screen.findByLabelText(/full lobby id/i);
    await user.clear(joinField);
    await user.type(joinField, LOBBY_ID);
    await user.click(joinWithCode);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });
  });
});

async function showJoinWithCode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /join lobby/i }));
  return screen.findByRole("button", { name: /join with code/i });
}

describe("Home negative paths", () => {
  const Original = globalThis.WebSocket;

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    globalThis.WebSocket = Original;
    vi.unstubAllGlobals();
  });

  it("rejects a short id fragment with a specific message", async () => {
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Realtime connected")).toBeInTheDocument();
    });
    const joinWithCode = await showJoinWithCode(user);
    const joinField = await screen.findByLabelText(/full lobby id/i);
    await user.clear(joinField);
    await user.type(joinField, "7DE6");
    await user.click(joinWithCode);
    expect(replace).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/full lobby id from the invite link/i),
    ).toBeInTheDocument();
  });

  it("maps join 404 to a friendly not-found string", async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo) => {
      const u = String(input);
      if (u.includes(LOBBY_ID) && u.includes("join")) {
        return new Response(JSON.stringify({ detail: "nope" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("nope", { status: 500 });
    });
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Realtime connected")).toBeInTheDocument();
    });
    const joinWithCode = await showJoinWithCode(user);
    const joinField = await screen.findByLabelText(/full lobby id/i);
    await user.clear(joinField);
    await user.type(joinField, LOBBY_ID);
    await user.click(joinWithCode);
    expect(
      await screen.findByText(
        "No lobby found with that code. Check and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("maps join 409 to a friendly conflict string", async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo) => {
      const u = String(input);
      if (u.includes(LOBBY_ID) && u.includes("join")) {
        return new Response(JSON.stringify({ detail: "full" }), {
          status: 409,
        });
      }
      return new Response("nope", { status: 500 });
    });
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Realtime connected")).toBeInTheDocument();
    });
    const joinWithCode = await showJoinWithCode(user);
    const joinField = await screen.findByLabelText(/full lobby id/i);
    await user.clear(joinField);
    await user.type(joinField, LOBBY_ID);
    await user.click(joinWithCode);
    expect(
      await screen.findByText(
        "That lobby is full or not accepting players right now.",
      ),
    ).toBeInTheDocument();
  });

  it("blocks create when realtime never delivers player_id", async () => {
    class StalledWs {
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
    globalThis.WebSocket = StalledWs as unknown as typeof WebSocket;
    const user = userEvent.setup();
    render(
      <PlayerConnectionProvider>
        <Home />
      </PlayerConnectionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/connecting\.\.\.|offline/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /create lobby/i }));
    expect(
      await screen.findByText(/not connected to the server/i),
    ).toBeInTheDocument();
  });
});
