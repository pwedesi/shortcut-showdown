import { describe, expect, it } from "vitest";
import { parseJoinLobbyInput } from "@/lib/lobbyQuery";

describe("parseJoinLobbyInput", () => {
  it("accepts hyphenated UUIDs", () => {
    const id = "7d8d9a0e-0b0c-4c5d-8e9f-0a1b2c3d4e5f";
    expect(parseJoinLobbyInput(id)).toEqual({ ok: true, id });
    expect(parseJoinLobbyInput(`  ${id}  `)).toEqual({ ok: true, id });
  });

  it("accepts short share codes shown in the lobby UI", () => {
    expect(parseJoinLobbyInput("96XKS9T")).toEqual({ ok: true, id: "96XKS9T" });
    expect(parseJoinLobbyInput("AX79")).toEqual({ ok: true, id: "AX79" });
    expect(parseJoinLobbyInput("Z9")).toEqual({ ok: true, id: "Z9" });
  });

  it("rejects empty input", () => {
    const r = parseJoinLobbyInput("  ");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/lobby screen/i);
    }
  });

  it("rejects values with spaces or punctuation", () => {
    expect(parseJoinLobbyInput("96X KS9T").ok).toBe(false);
    expect(parseJoinLobbyInput("96XKS9T!").ok).toBe(false);
  });

  it("rejects overly long paste", () => {
    const r = parseJoinLobbyInput("a".repeat(65));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/too long/i);
    }
  });
});
