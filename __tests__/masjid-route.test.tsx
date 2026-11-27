import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Masjid } from "@/src/types/masjid";

const { getLiveTimetableMock, usePreferencesMock } = vi.hoisted(() => ({
  getLiveTimetableMock: vi.fn(),
  usePreferencesMock: vi.fn(),
}));

vi.mock("@/src/lib/server-timetable", () => ({ getLiveTimetable: getLiveTimetableMock, getTimetableWithFallback: getLiveTimetableMock }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/components/PreferencesProvider", () => ({ usePreferences: usePreferencesMock }));

import MasjidPage from "@/app/masjid/[id]/page";
import { ClientDetail } from "@/components/ClientDetail";
import { masjids as bundledMasjids } from "@/src/lib/data";

const gmNagar: Masjid = {
  id: "gm-nagar-muslim-masjid",
  name_en: "GM Nagar Muslim Masjid",
  name_ta: "ஜி.எம். நகர் முஸ்லிம் மஸ்ஜித்",
  address_ta: null,
  lat: 10.98801,
  lng: 76.970163,
  prayers: [
    ["fajr", "05:05", "05:30"],
    ["dhuhr", "12:45", "13:05"],
    ["asr", "16:00", "16:20"],
    ["maghrib", "18:03", "18:06"],
    ["isha", "19:17", "19:35"],
    ["jumuah", "12:40", "13:30"],
  ].map(([prayer, adhan, iqamah]) => ({
    prayer,
    adhan,
    iqamah,
    observedOn: "2026-11-25",
    effectiveFrom: null,
    source: "digital_timetable_photo",
    handwritten: false,
    unclear: false,
    ...(prayer === "jumuah" ? { timingPattern: "fixed" as const } : {}),
  })) as Masjid["prayers"],
  affiliation: "SUNNAT JAMAAT",
  mapsUrl: "https://maps.app.goo.gl/125jiwRLLBQsvzFG7",
  active: true,
  observedOn: "2026-11-25",
  source: "digital_timetable_photo",
  notes: null,
  timingPattern: "fixed",
  updatedAt: "2026-11-25T14:40:08.741Z",
};

function feed(masjids: Masjid[], sourceStale = false) {
  return { version: "81", publishedAt: "2026-11-25T14:40:08.741Z", sourceStale, masjids };
}

function preferences(language: "ta" | "en") {
  return {
    theme: "night-blue",
    setTheme: vi.fn(),
    timeFormat: "12h",
    setTimeFormat: vi.fn(),
    language,
    setLanguage: vi.fn(),
    masjids: [],
    dataStale: false,
    dataSource: "live",
    lastDataUpdate: "2026-11-25T14:40:08.741Z",
    offline: false,
  };
}

async function pageFor(id: string) {
  return MasjidPage({ params: Promise.resolve({ id }) });
}

describe("masjid detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLiveTimetableMock.mockResolvedValue(feed(bundledMasjids));
    usePreferencesMock.mockReturnValue(preferences("ta"));
  });

  it("resolves a published Masjid that is absent from the bundled snapshot", async () => {
    const liveOnly = { ...bundledMasjids[0], id: "published-after-build" };
    expect(bundledMasjids.some((masjid) => masjid.id === liveOnly.id)).toBe(false);
    getLiveTimetableMock.mockResolvedValue(feed([liveOnly]));

    const page = await pageFor(liveOnly.id);

    expect(page.type).toBe(ClientDetail);
    expect(page.props.masjid.id).toBe(liveOnly.id);
  });

  it("resolves existing Masjids from the live publisher feed", async () => {
    const page = await pageFor(bundledMasjids[0].id);

    expect(page.type).toBe(ClientDetail);
    expect(page.props.masjid.id).toBe(bundledMasjids[0].id);
  });

  it("resolves GM Nagar with its published identity, coordinates, and prayer timings", async () => {
    getLiveTimetableMock.mockResolvedValue(feed([gmNagar]));

    const page = await pageFor(gmNagar.id);

    expect(page.props.masjid).toMatchObject({
      id: "gm-nagar-muslim-masjid",
      name_en: "GM Nagar Muslim Masjid",
      name_ta: "ஜி.எம். நகர் முஸ்லிம் மஸ்ஜித்",
      lat: 10.98801,
      lng: 76.970163,
      prayers: expect.arrayContaining([
        expect.objectContaining({ prayer: "fajr", adhan: "05:05", iqamah: "05:30" }),
        expect.objectContaining({ prayer: "maghrib", adhan: "18:03", iqamah: "18:06" }),
        expect.objectContaining({ prayer: "isha", adhan: "19:17", iqamah: "19:35" }),
      ]),
    });
  });

  it("returns not-found only when a fresh publisher feed confirms the ID is unknown", async () => {
    getLiveTimetableMock.mockResolvedValue(feed(bundledMasjids));

    await expect(pageFor("unknown-masjid-id")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("uses the bundled fallback when the publisher is unavailable or reports stale data", async () => {
    getLiveTimetableMock.mockRejectedValue(new Error("network unavailable"));

    const page = await pageFor(bundledMasjids[0].id);

    expect(page.type).toBe(ClientDetail);
    expect(page.props.masjid.id).toBe(bundledMasjids[0].id);

    getLiveTimetableMock.mockResolvedValue(feed([], true));
    const staleFallbackPage = await pageFor(bundledMasjids[0].id);
    expect(staleFallbackPage.type).toBe(ClientDetail);
    expect(staleFallbackPage.props.masjid.id).toBe(bundledMasjids[0].id);
  });

  it("does not misreport an unknown ID when the source is stale or unavailable", async () => {
    const liveOnly = { ...bundledMasjids[0], id: "not-in-stale-feed-or-snapshot" };
    getLiveTimetableMock.mockResolvedValue(feed([], true));
    await expect(pageFor(liveOnly.id)).rejects.toThrow("temporarily unavailable");

    getLiveTimetableMock.mockRejectedValue(new Error("network unavailable"));
    await expect(pageFor(liveOnly.id)).rejects.toThrow("temporarily unavailable");
  });

  it("makes a newly published Masjid accessible on the next route request", async () => {
    const liveOnly = { ...bundledMasjids[0], id: "published-during-runtime" };
    getLiveTimetableMock.mockResolvedValueOnce(feed(bundledMasjids));
    await expect(pageFor(liveOnly.id)).rejects.toThrow("NEXT_NOT_FOUND");

    getLiveTimetableMock.mockResolvedValueOnce(feed([...bundledMasjids, liveOnly]));
    const page = await pageFor(liveOnly.id);
    expect(page.props.masjid.id).toBe(liveOnly.id);
  });

  it("preserves Tamil and English detail headings and published timetable content", async () => {
    getLiveTimetableMock.mockResolvedValue(feed([gmNagar]));
    usePreferencesMock.mockReturnValue(preferences("ta"));
    const tamilHtml = renderToStaticMarkup(await pageFor(gmNagar.id));
    expect(tamilHtml).toContain(gmNagar.name_ta);
    expect(tamilHtml).toContain(gmNagar.name_en);
    expect(tamilHtml).toContain("5:05 AM");

    usePreferencesMock.mockReturnValue(preferences("en"));
    const englishHtml = renderToStaticMarkup(await pageFor(gmNagar.id));
    expect(englishHtml).toContain(gmNagar.name_en);
    expect(englishHtml).toContain(gmNagar.name_ta);
    expect(englishHtml).toContain("5:05 AM");
  });
});
