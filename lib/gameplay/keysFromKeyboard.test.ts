import { describe, expect, it } from "vitest";
import {
  keysFromKeyboardEvent,
  keysFromTextEntry,
} from "@/lib/gameplay/keysFromKeyboard";

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

  it("normalizes enter/delete aliases", () => {
    expect(keysFromTextEntry("return")).toEqual(["enter"]);
    expect(keysFromTextEntry("del")).toEqual(["delete"]);
  });
});

describe("keysFromKeyboardEvent", () => {
  it("does not duplicate modifier key token", () => {
    const keys = keysFromKeyboardEvent({
      key: "Shift",
      shiftKey: true,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
    } as unknown as KeyboardEvent);
    expect(keys).toEqual(["shift"]);
  });

  it("captures ctrl+shift+arrowright consistently", () => {
    const keys = keysFromKeyboardEvent({
      key: "ArrowRight",
      shiftKey: true,
      ctrlKey: true,
      metaKey: false,
      altKey: false,
    } as unknown as KeyboardEvent);
    expect(keys).toEqual(["shift", "ctrl", "arrowright"]);
  });
});
