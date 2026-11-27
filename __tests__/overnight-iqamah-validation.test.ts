import { describe, expect, it } from "vitest";
import type { Masjid, PrayerKey } from "@/src/types/masjid";
import { getNextIqamah } from "@/src/lib/next-iqamah";
import { getDailyIqamahs } from "@/src/lib/scheduling";
import { validateMasjids } from "@/src/lib/validation";

const prayers: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"];
function fixture(ishaAdhan: string, ishaIqamah: string): Masjid[] {
  return [{
    id: "overnight-fixture", name_en: "Overnight Fixture", name_ta: null, address_ta: null, lat: null, lng: null,
    prayers: prayers.map((prayer) => ({
      prayer,
      adhan: prayer === "isha" ? ishaAdhan : prayer === "jumuah" ? "12:40" : "05:00",
      iqamah: prayer === "isha" ? ishaIqamah : prayer === "jumuah" ? "13:00" : "05:20",
      observedOn: null, effectiveFrom: null, source: "noticeboard_photo", handwritten: false, unclear: false,
    })),
  }];
}

describe("fixed-time Iqamah validation and scheduling", () => {
  it("accepts and schedules a normal same-day Iqamah after Adhan", () => {
    const masjids = fixture("23:30", "23:45");
    expect(validateMasjids(masjids)).toBe(true);
    const result = getDailyIqamahs(masjids, new Date("2026-11-23T17:35:00.000Z"));
    expect(result.upcoming.find((entry) => entry.prayer === "isha")).toMatchObject({ time: "23:45", tomorrow: false });
    expect(getNextIqamah(masjids[0], new Date("2026-11-23T17:35:00.000Z"))).toMatchObject({ prayer: "isha", time: "23:45", tomorrow: false });
  });

  it("accepts and schedules a fixed Iqamah shortly after midnight as next day", () => {
    const masjids = fixture("23:55", "00:05");
    expect(validateMasjids(masjids)).toBe(true);
    const result = getDailyIqamahs(masjids, new Date("2026-11-23T18:26:00.000Z"));
    expect(result.upcoming.find((entry) => entry.prayer === "isha")).toMatchObject({ time: "00:05", tomorrow: true });
    expect(getNextIqamah(masjids[0], new Date("2026-11-23T18:26:00.000Z"))).toMatchObject({ prayer: "isha", time: "00:05", tomorrow: true });
  });

  it("rejects malformed times and reversed same-day times outside the overnight window", () => {
    expect(validateMasjids(fixture("23:55", "23:30"))).toBe(false);
    expect(validateMasjids(fixture("23:55", "24:05"))).toBe(false);
  });
});
