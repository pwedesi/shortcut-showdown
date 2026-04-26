import { describe, expect, it } from "vitest";
import { keysFromTextEntry } from "@/lib/gameplay/keysFromKeyboard";

describe("keysFromTextEntry", () => {
  it("normalizes common typed shortcuts", () => {
    expect(keysFromTextEntry("Ctrl + C")).toEqual(["ctrl", "c"]);
    expect(keysFromTextEntry("command+v")).toEqual(["ctrl", "v"]);
  });
});

describe("keysFromTextEntry edge cases", () => {
  it("parses meta alias", () => {
    const parts = keysFromTextEntry("meta  z");
    expect(parts[0]).toBe("ctrl");
  });
});
