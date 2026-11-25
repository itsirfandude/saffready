import type { LiveTimetable } from "@/src/lib/server-timetable";
import type { Masjid } from "@/src/types/masjid";

export class MasjidNotFoundError extends Error {
  constructor(id: string) {
    super(`Masjid ${id} was not found in the current publisher feed`);
    this.name = "MasjidNotFoundError";
  }
}

export class TimetableUnavailableError extends Error {
  constructor() {
    super("The latest masjid timetable is temporarily unavailable");
    this.name = "TimetableUnavailableError";
  }
}

export async function getMasjidForDetail(
  id: string,
  loadLive: () => Promise<LiveTimetable>,
  fallback: Masjid[],
): Promise<Masjid> {
  let live: LiveTimetable | null = null;
  try {
    live = await loadLive();
  } catch {
    // An unavailable publisher cannot establish that an ID is genuinely unknown.
  }

  const current = live?.masjids.find((masjid) => masjid.id === id);
  if (current) return current;

  if (live && !live.sourceStale) throw new MasjidNotFoundError(id);

  const bundled = fallback.find((masjid) => masjid.id === id);
  if (bundled) return bundled;

  throw new TimetableUnavailableError();
}
