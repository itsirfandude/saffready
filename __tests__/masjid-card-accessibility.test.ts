import { describe, expect, it } from "vitest";
import { buildMasjidCardAccessibleLabel } from "@/src/lib/masjid-card-accessibility";

describe("Masjid card accessible labels", () => {
  it("preserves a long Tamil name and includes the upcoming prayer, time, estimate, and status", () => {
    const name = "மஸ்ஜிதுல் முஃமினீன் அல் ஹிதாயா சமூக நல மையம்";
    const label = buildMasjidCardAccessibleLabel({
      name, prayer: "துஹர்", iqamahTime: "1:00 PM", minutesRemaining: 44,
      travel: { distanceKm: 0.5, adjustedDistanceKm: 0.65, walkMinutes: 8, bikeMinutes: 3, mode: "walk", minutes: 8 },
      mayMiss: true, language: "ta",
    });
    expect(label).toContain(name);
    expect(label).toContain("1:00 PM");
    expect(label).toContain("44");
    expect(label).toContain("நடை");
    expect(label).toContain("தாமதமாகும்");
    expect(label.length).toBeGreaterThan(60);
  });

  it("does not imply travel or a miss for a Masjid without coordinates", () => {
    const label = buildMasjidCardAccessibleLabel({
      name: "Masjidul Quddus", prayer: "Dhuhr", iqamahTime: "1:00 PM", minutesRemaining: 44,
      travel: null, mayMiss: false, language: "en",
    });
    expect(label).not.toContain("walk");
    expect(label).not.toContain("May miss");
  });
});
