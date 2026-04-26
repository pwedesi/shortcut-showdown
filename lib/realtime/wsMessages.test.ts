import { describe, expect, it } from "vitest";
import {
  mergeServerMessageBody,
  parseConnectPlayerId,
  parseConnectPlayerIdFromMessage,
} from "@/lib/realtime/wsMessages";

describe("parseConnectPlayerId", () => {
  it("extracts player_id from connect event", () => {
    expect(
      parseConnectPlayerId(
        JSON.stringify({ event: "connect", player_id: "abc-123" }),
      ),
    ).toBe("abc-123");
  });

  it("returns null for other events", () => {
    expect(
      parseConnectPlayerId(JSON.stringify({ event: "ping" })),
    ).toBeNull();
  });

  it("returns null for invalid json", () => {
    expect(parseConnectPlayerId("not json")).toBeNull();
  });

  it("reads player_id from payload on connect", () => {
    expect(
      parseConnectPlayerIdFromMessage({
        v: 1,
        event: "connect",
        payload: { player_id: "p-payload" },
      }),
    ).toBe("p-payload");
  });
});

describe("mergeServerMessageBody", () => {
  it("merges payload and top-level fields", () => {
    const m = mergeServerMessageBody({
      v: 1,
      event: "game_state_update",
      payload: { room_id: "r1", state_version: 2 },
      game_state: { status: "running" },
    });
    expect(m.room_id).toBe("r1");
    expect(m.state_version).toBe(2);
    expect(m.game_state).toEqual({ status: "running" });
  });
});
