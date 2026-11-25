import { unstable_cache } from "next/cache";
import { isTimetableFeedStale, TIMETABLE_SERVER_REVALIDATE_SECONDS } from "@/src/lib/timetable-cache";
import { validateMasjids } from "@/src/lib/validation";
import type { Masjid } from "@/src/types/masjid";

export type LiveTimetable = {
  [key: string]: unknown;
  masjids: Masjid[];
  publishedAt: string;
  sourceStale: boolean;
};

type CachedFeed = { data: Record<string, unknown>; fetchedAt: number };

const getCachedFeed = unstable_cache(
  async (endpoint: string): Promise<CachedFeed> => {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Publisher unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Publisher response is not an object");
    const payload = data as Record<string, unknown>;
    if (!validateMasjids(payload.masjids) || !payload.version || typeof payload.publishedAt !== "string" || !payload.publishedAt) {
      throw new Error("Publisher returned an invalid timetable");
    }
    return { data: payload, fetchedAt: Date.now() };
  },
  ["saffready-apps-script-timetable"],
  { revalidate: TIMETABLE_SERVER_REVALIDATE_SECONDS },
);

export async function getLiveTimetable(endpoint = process.env.SHEETS_JSON_URL): Promise<LiveTimetable> {
  if (!endpoint) throw new Error("Timetable source is not configured");
  const cached = await getCachedFeed(endpoint);
  return {
    ...cached.data,
    masjids: cached.data.masjids as Masjid[],
    publishedAt: cached.data.publishedAt as string,
    sourceStale: isTimetableFeedStale(cached.data.sourceStale, cached.fetchedAt),
  };
}
