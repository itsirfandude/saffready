import { describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { isTimetableFeedStale, readTimetableCache, TIMETABLE_CACHE_MAX_AGE_MS, TIMETABLE_SERVER_CACHE_MAX_AGE_MS } from "@/src/lib/timetable-cache";

const now = Date.parse("2026-11-25T12:00:00.000Z");

describe("timetable local cache", () => {
  it("accepts a valid saved feed within the 24-hour limit", () => {
    const cache = { masjids, publishedAt: "2026-11-25T10:00:00.000Z", cachedAt: now - 2 * 60 * 60 * 1000 };
    expect(readTimetableCache(JSON.stringify(cache), now)).toEqual({ state: "valid", value: cache });
  });

  it("expires the saved feed after 24 hours", () => {
    const cache = { masjids, publishedAt: "2026-11-24T10:00:00.000Z", cachedAt: now - TIMETABLE_CACHE_MAX_AGE_MS };
    expect(readTimetableCache(JSON.stringify(cache), now)).toEqual({ state: "expired" });
  });

  it("migrates the older format using publishedAt as its age", () => {
    const cache = { masjids, publishedAt: "2026-11-25T10:00:00.000Z" };
    expect(readTimetableCache(JSON.stringify(cache), now)).toMatchObject({ state: "valid", value: { cachedAt: Date.parse(cache.publishedAt) } });
  });

  it("rejects malformed or future-dated cache entries", () => {
    expect(readTimetableCache("not json", now)).toEqual({ state: "invalid" });
    const cache = { masjids, publishedAt: "2026-11-26T10:00:00.000Z", cachedAt: now + 1000 };
    expect(readTimetableCache(JSON.stringify(cache), now)).toEqual({ state: "invalid" });
  });

  it("marks a stale Apps Script or expired server snapshot as stale", () => {
    expect(isTimetableFeedStale(true, now, now)).toBe(true);
    expect(isTimetableFeedStale(false, now - TIMETABLE_SERVER_CACHE_MAX_AGE_MS, now)).toBe(true);
    expect(isTimetableFeedStale(false, now - TIMETABLE_SERVER_CACHE_MAX_AGE_MS + 1, now)).toBe(false);
  });
});
