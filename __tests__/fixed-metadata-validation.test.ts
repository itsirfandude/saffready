import { describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { validateMasjids } from "@/src/lib/validation";
import type { PrayerKey } from "@/src/types/masjid";

const prayerKeys: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"];
const fixture = () => structuredClone(masjids.slice(0, 1));

describe("fixed prayer metadata validation", () => {
  it("accepts confirmed metadata on each of the six prayer categories", () => {
    const records = fixture();
    records[0].prayers = records[0].prayers.map((record) => ({
      ...record,
      fixed: true,
      fixedBasis: `Confirmed by the Masjid for ${record.prayer}`,
      fixedCheckedOn: "2026-11-27",
    }));

    expect(prayerKeys.every((key) => records[0].prayers.some((record) => record.prayer === key && record.fixed === true))).toBe(true);
    expect(validateMasjids(records)).toBe(true);
  });

  it.each([
    ["missing confirmation basis", { fixedBasis: "   ", fixedCheckedOn: "2026-11-27" }],
    ["missing checked date", { fixedBasis: "Confirmed by the Masjid", fixedCheckedOn: null }],
    ["impossible checked date", { fixedBasis: "Confirmed by the Masjid", fixedCheckedOn: "2026-02-30" }],
    ["incorrectly formatted checked date", { fixedBasis: "Confirmed by the Masjid", fixedCheckedOn: "27-11-2026" }],
  ])("rejects a TRUE flag with %s", (_description, provenance) => {
    const records = fixture();
    records[0].prayers[0] = { ...records[0].prayers[0], fixed: true, ...provenance };
    expect(validateMasjids(records)).toBe(false);
  });

  it("accepts blank Jumu'ah timings when its fixed flag is not TRUE", () => {
    const records = fixture();
    const jumuah = records[0].prayers.findIndex((record) => record.prayer === "jumuah");
    records[0].prayers[jumuah] = {
      ...records[0].prayers[jumuah], adhan: null, iqamah: null, fixed: null,
      fixedBasis: null, fixedCheckedOn: null,
    };
    expect(validateMasjids(records)).toBe(true);
    records[0].prayers[jumuah] = {
      ...records[0].prayers[jumuah], fixed: true,
      fixedBasis: "Confirmed by the Masjid", fixedCheckedOn: "2026-11-27",
    };
    expect(validateMasjids(records)).toBe(false);
  });
});
