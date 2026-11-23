import { describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { formatDistance, haversineDistanceKm, sortByDistance } from "@/src/lib/distance";

describe("masjid directory", () => {
  it("contains ten masjids with valid coordinates and detail ids", () => {
    expect(masjids).toHaveLength(10);
    for (const masjid of masjids) {
      expect(masjid.lat).toBeGreaterThanOrEqual(-90);
      expect(masjid.lat).toBeLessThanOrEqual(90);
      expect(masjid.lng).toBeGreaterThanOrEqual(-180);
      expect(masjid.lng).toBeLessThanOrEqual(180);
      expect(masjid.prayers).toHaveLength(6);
    }
  });

  it("preserves the corrected new schedules and quiet affiliations", () => {
    const aamina = masjids.find((item) => item.name_en === "Masjid Aamina Binth Wahab")!;
    const jannath = masjids.find((item) => item.name_en === "Masjidul Jannath")!;
    expect(aamina.affiliation).toBe("SUNNAT JAMAAT");
    expect(aamina.prayers.find((item) => item.prayer === "fajr")?.adhan).toBe("05:00");
    expect(aamina.prayers.find((item) => item.prayer === "maghrib")?.iqamah).toEqual({ type: "after_adhan", offsetMin: 0 });
    expect(jannath.prayers.find((item) => item.prayer === "jumuah")).toMatchObject({ adhan: "12:30", iqamah: "13:10" });
    expect(masjids.find((item) => item.name_en === "Masjid Arafa")?.affiliation).toBeNull();
  });
});

describe("distance sorting", () => {
  it("calculates straight-line distance and sorts nearest first", () => {
    const items = masjids.slice(0, 3).map((masjid) => ({ masjid }));
    const sorted = sortByDistance(items, { latitude: 10.9818, longitude: 76.9646 });
    expect(sorted[0].masjid.name_en).toBe("Masjidus Salaam");
    expect(haversineDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(formatDistance(0.45)).toBe("450 m away");
    expect(formatDistance(1.2)).toBe("1.2 km away");
  });
});
