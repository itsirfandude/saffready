import { describe, expect, it } from "vitest";
import { selectOngoingHero } from "@/src/lib/hero-selection";
import type { DailyIqamah } from "@/src/lib/scheduling";
import type { Masjid } from "@/src/types/masjid";

const masjid = (id: string): Masjid => ({ id, name_en: id, name_ta: null, address_ta: null, lat: null, lng: null, prayers: [] });
const item = (id: string, minute: number): DailyIqamah => ({ masjid: masjid(id), prayer: "isha", time: "19:00", at: new Date(`2026-11-24T${String(minute).padStart(2, "0")}:00:00Z`) });

describe("ongoing hero selection", () => {
  it("takes over for an ongoing prayer and chooses the first relevant one", () => {
    expect(selectOngoingHero([item("first", 10), item("second", 11)], null)?.masjid.id).toBe("first");
  });
  it("keeps the selected ongoing prayer stable while it remains ongoing", () => {
    expect(selectOngoingHero([item("first", 10), item("second", 11)], "second:isha:19:00")?.masjid.id).toBe("second");
  });
  it("promotes another ongoing prayer when the selected one completes", () => {
    expect(selectOngoingHero([item("second", 11)], "first:isha:19:00")?.masjid.id).toBe("second");
  });
  it("returns no override when there are no ongoing prayers", () => {
    expect(selectOngoingHero([], "first:isha:19:00")).toBeNull();
  });
});
