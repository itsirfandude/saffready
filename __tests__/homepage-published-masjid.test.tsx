import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Masjid } from "@/src/types/masjid";

const { publishedMasjids } = vi.hoisted(() => ({ publishedMasjids: vi.fn() }));
vi.mock("@/components/PreferencesProvider", () => ({ usePreferences: () => ({
  timeFormat: "24h", language: "en", masjids: publishedMasjids(), dataStale: false,
  dataSource: "live", lastDataUpdate: "2026-11-27T00:00:00.000Z", offline: false,
}) }));

import { ClientHome } from "@/components/ClientHome";

const newlyPublished: Masjid = {
  id: "published-after-build", name_en: "Freshly Published Masjid", name_ta: null, address_ta: null,
  lat: null, lng: null, prayers: [{
    prayer: "fajr", adhan: "05:00", iqamah: "05:20", observedOn: null, effectiveFrom: null,
    source: "noticeboard_photo", handwritten: false, unclear: false,
  }],
};

describe("homepage live timetable consumption", () => {
  it("renders a Masjid delivered from the published API payload without a redeployment", () => {
    publishedMasjids.mockReturnValue([newlyPublished]);
    const html=renderToStaticMarkup(<ClientHome/>);
    expect(html).toContain("Freshly Published Masjid");
    expect(html).toContain("/masjid/published-after-build");
  });
});
