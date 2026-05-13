import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "@/lib/browser";

describe("copyTextToClipboard", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses navigator.clipboard.writeText when it succeeds", async () => {
    const ok = await copyTextToClipboard("hello");
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
  });
});
