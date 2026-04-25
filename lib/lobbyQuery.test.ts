import { describe, expect, it } from "vitest";
import {
  buildLobbyPath,
  getLobbyIdFromSearchParams,
  parseJoinLobbyInput,
} from "@/lib/lobbyQuery";

describe("getLobbyIdFromSearchParams", () => {
  it("prefers id over code", () => {
    const sp = new URLSearchParams("id=uuid-1&code=ZZ");
    expect(getLobbyIdFromSearchParams(sp)).toBe("uuid-1");
  });

  it("falls back to code", () => {
    const sp = new URLSearchParams("code=AB12");
    expect(getLobbyIdFromSearchParams(sp)).toBe("AB12");
  });
});

describe("parseJoinLobbyInput", () => {
  it("accepts full uuid", () => {
    const id = "7de683bc-8b35-49db-add7-b21c1edbc1bc";
    expect(parseJoinLobbyInput(id)).toEqual({ ok: true, id });
  });

  it("rejects a 4-char slice of a uuid", () => {
    const r = parseJoinLobbyInput("7DE6");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/short/i);
    }
  });
});

describe("buildLobbyPath", () => {
  it("sets id and optional code", () => {
    expect(buildLobbyPath({ id: "x", code: "Y" })).toBe(
      "/lobby?id=x&code=Y",
    );
  });
});
