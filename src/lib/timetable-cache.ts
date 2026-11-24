import { validateMasjids } from "@/src/lib/validation";
import type { Masjid } from "@/src/types/masjid";

export const TIMETABLE_CACHE_KEY = "saffready-timetable-cache";
export const TIMETABLE_SERVER_REVALIDATE_SECONDS = 300;
export const TIMETABLE_SERVER_CACHE_MAX_AGE_MS = TIMETABLE_SERVER_REVALIDATE_SECONDS * 1000;
export const TIMETABLE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isTimetableFeedStale(sourceStale: unknown, fetchedAt: number, now = Date.now()): boolean {
  return sourceStale === true || now - fetchedAt >= TIMETABLE_SERVER_CACHE_MAX_AGE_MS;
}

export type TimetableCache = {
  masjids: Masjid[];
  publishedAt: string;
  cachedAt: number;
};

export type TimetableCacheRead =
  | { state: "valid"; value: TimetableCache }
  | { state: "expired" | "invalid" };

export function readTimetableCache(raw: string | null, now = Date.now()): TimetableCacheRead {
  if (!raw) return { state: "invalid" };
  try {
    const value = JSON.parse(raw) as Partial<TimetableCache>;
    if (!validateMasjids(value.masjids) || typeof value.publishedAt !== "string") return { state: "invalid" };

    // Older cache entries have no cachedAt; use publishedAt once to migrate safely.
    const cachedAt = Number.isFinite(value.cachedAt) ? Number(value.cachedAt) : Date.parse(value.publishedAt);
    const age = now - cachedAt;
    if (!Number.isFinite(cachedAt) || age < 0) return { state: "invalid" };
    if (age >= TIMETABLE_CACHE_MAX_AGE_MS) return { state: "expired" };

    return { state: "valid", value: { masjids: value.masjids, publishedAt: value.publishedAt, cachedAt } };
  } catch {
    return { state: "invalid" };
  }
}
