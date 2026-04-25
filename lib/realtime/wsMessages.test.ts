import { describe, expect, it } from "vitest";
import { parseConnectPlayerId } from "@/lib/realtime/wsMessages";

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
});
