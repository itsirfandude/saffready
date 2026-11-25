import { describe, expect, it } from "vitest";
import { COUNTDOWN_REFRESH_MS, formatCountdown, minutesUntil } from "@/src/lib/countdown";
import { offlineTimetableNotice } from "@/components/TimetableDataNotice";

describe("minute countdown presentation", () => {
  it("uses compact minute and hour labels, including the start boundary", () => {
    expect(formatCountdown(0)).toBe("less than 1 min");
    expect(formatCountdown(15)).toBe("15 min");
    expect(formatCountdown(65)).toBe("1 h 5 min");
    expect(formatCountdown(120)).toBe("2 h");
  });

  it("rounds upward to the next displayed minute while keeping exact scheduling instants", () => {
    const now = new Date("2026-11-24T10:00:00Z");
    expect(minutesUntil(new Date(now.getTime() + 60_001), now)).toBe(2);
    expect(minutesUntil(new Date(now.getTime() + 60_000), now)).toBe(1);
  });

  it("refreshes at one-minute intervals and keeps the countdown outside live announcements", () => {
    expect(COUNTDOWN_REFRESH_MS).toBe(60_000);
  });

  it("shows cached-data language only while actually offline", () => {
    expect(offlineTimetableNotice(false, "cached", "en")).toBeNull();
    expect(offlineTimetableNotice(true, "cached", "en")).toBe("Offline · showing saved timetable");
    expect(offlineTimetableNotice(true, "bundled", "en")).toBe("Offline · using built-in timetable");
  });
});
