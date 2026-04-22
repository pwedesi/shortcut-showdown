import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => "http://test.local",
}));

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const data = await apiRequest<{ ok: boolean }>("/lobbies");
    expect(data).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://test.local/lobbies",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("maps 404 to ApiError not_found", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "missing" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const err: unknown = await apiRequest("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) {
      expect(err.code).toBe("not_found");
    }
  });

  it("maps 409 to conflict", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "full" }), { status: 409 }),
    );
    await expect(apiRequest("/x")).rejects.toMatchObject({
      code: "conflict",
    });
  });

  it("maps network failure to network code", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("failed to fetch"));
    await expect(apiRequest("/x")).rejects.toMatchObject({
      code: "network",
    });
  });
});
