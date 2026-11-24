import { describe, expect, it } from "vitest";
import { formatDuration } from "@/src/lib/format-duration";

describe("formatDuration", () => {
  it("formats English minute and hour durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h 0 min");
    expect(formatDuration(65)).toBe("1 h 5 min");
    expect(formatDuration(329)).toBe("5 h 29 min");
  });
  it("formats Tamil durations", () => {
    expect(formatDuration(45, "ta")).toBe("45 நிமி");
    expect(formatDuration(65, "ta")).toBe("1 மணி 5 நிமி");
  });
  it("handles zero and invalid values safely", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration(-1)).toBe("");
  });
});
