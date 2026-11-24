import { describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { estimateTravel, haversineDistanceKm, isReachable, travelForMasjid } from "@/src/lib/travel";

describe("travel estimates", () => {
  it("uses Haversine straight-line distance and applies the 1.3 detour", () => {
    const estimate = estimateTravel(1);
    expect(estimate.distanceKm).toBe(1);
    expect(estimate.adjustedDistanceKm).toBeCloseTo(1.3);
    expect(estimate.walkMinutes).toBe(16);
  });

  it("uses walking through 20 minutes, then switches to bicycle", () => {
    expect(estimateTravel(1.2).mode).toBe("walk");
    expect(estimateTravel(1.35)).toMatchObject({ mode: "bike", walkMinutes: 22, bikeMinutes: 8, minutes: 8 });
  });

  it("returns no travel information when Masjid coordinates are absent or invalid", () => {
    const masjid = masjids[0];
    expect(travelForMasjid({ latitude: 10.98, longitude: 76.96 }, { ...masjid, lat: null, lng: null })).toBeNull();
    expect(travelForMasjid({ latitude: 91, longitude: 76.96 }, masjid)).toBeNull();
    expect(haversineDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(travelForMasjid({ latitude: masjid.lat!, longitude: masjid.lng! }, masjid)?.distanceKm).toBe(0);
  });

  it("includes the one-minute buffer and never reaches an expired Iqamah", () => {
    const now = new Date("2026-11-24T10:00:00Z");
    expect(isReachable(now, new Date(now.getTime() + 6 * 60_000), 5)).toBe(true);
    expect(isReachable(now, new Date(now.getTime() + 5 * 60_000 + 59_000), 5)).toBe(false);
    expect(isReachable(now, new Date(now.getTime() - 1), 0)).toBe(false);
  });
});
