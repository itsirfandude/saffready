import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { isTimetableFeedStale, TIMETABLE_SERVER_REVALIDATE_SECONDS } from "@/src/lib/timetable-cache";
import { validateMasjids } from "@/src/lib/validation";

type CachedFeed = { data: Record<string, unknown>; fetchedAt: number };

const getCachedFeed = unstable_cache(
  async (endpoint: string): Promise<CachedFeed> => {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Publisher unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") throw new Error("Publisher response is not an object");
    const payload = data as Record<string, unknown>;
    if (!validateMasjids(payload.masjids) || !payload.version || !payload.publishedAt) {
      throw new Error("Publisher returned an invalid timetable");
    }
    return { data: payload, fetchedAt: Date.now() };
  },
  ["saffready-apps-script-timetable"],
  { revalidate: TIMETABLE_SERVER_REVALIDATE_SECONDS },
);

export async function GET() {
  const endpoint = process.env.SHEETS_JSON_URL;
  if (!endpoint) {
    return NextResponse.json({ error: "Timetable source is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const cached = await getCachedFeed(endpoint);
    const sourceStale = isTimetableFeedStale(cached.data.sourceStale, cached.fetchedAt);
    return NextResponse.json({ ...cached.data, sourceStale }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Latest timetable unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
