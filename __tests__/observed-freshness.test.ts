import { describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { getObservationFreshness } from "@/src/lib/observed-freshness";
import { daysSince, freshnessLabel } from "@/src/lib/freshness";

const now = new Date("2026-11-24T18:30:00.000Z"); // 2026-11-25 in Asia/Kolkata

describe("observation freshness", () => {
  it("uses the oldest valid observation across active and inactive Masjids", () => {
    const records = masjids.slice(0, 2).map((masjid) => ({
      ...masjid,
      active: false,
      prayers: masjid.prayers.map((prayer) => ({ ...prayer, observedOn: "2026-11-24" })),
    }));
    records[1].prayers[0].observedOn = "2026-11-11";
    expect(getObservationFreshness(records, now)).toMatchObject({ oldest: "2026-11-11", ageDays: 14, stale: false });
  });

  it("marks dates older than 14 days stale but not exactly 14 days", () => {
    const masjid = masjids[0];
    const at14 = { ...masjid, prayers: masjid.prayers.map((prayer) => ({ ...prayer, observedOn: "2026-11-11" })) };
    const at15 = { ...masjid, prayers: masjid.prayers.map((prayer) => ({ ...prayer, observedOn: "2026-11-10" })) };
    expect(getObservationFreshness([at14], now).stale).toBe(false);
    expect(getObservationFreshness([at15], now).stale).toBe(true);
    expect(daysSince("2026-11-11", now)).toBe(14);
    expect(daysSince("2026-11-10", now)).toBe(15);
  });

  it("treats future observation dates as unavailable using the India calendar day", () => {
    const beforeIndiaMidnight = new Date("2026-11-24T18:29:59.000Z");
    const afterIndiaMidnight = new Date("2026-11-24T18:30:00.000Z");
    expect(daysSince("2026-11-25", beforeIndiaMidnight)).toBeNull();
    expect(freshnessLabel("2026-11-25", beforeIndiaMidnight)).toBe("Observation unavailable");
    expect(daysSince("2026-11-25", afterIndiaMidnight)).toBe(0);

    const masjid = { ...masjids[0], observedOn: "2026-11-26", prayers: masjids[0].prayers.map((prayer) => ({ ...prayer, observedOn: "2026-11-26" })) };
    expect(getObservationFreshness([masjid], afterIndiaMidnight)).toMatchObject({ oldest: null, ageDays: null, stale: false, missingOrInvalid: 1 });
  });

  it("counts missing and invalid observations instead of silently omitting Masjids", () => {
    const masjid = masjids[0];
    const missing = { ...masjid, observedOn: null, prayers: masjid.prayers.map((prayer) => ({ ...prayer, observedOn: null })) };
    const invalid = { ...masjid, observedOn: null, prayers: masjid.prayers.map((prayer) => ({ ...prayer, observedOn: "2026-02-31" })) };
    const result = getObservationFreshness([missing, invalid], now);
    expect(result).toMatchObject({ oldest: null, ageDays: null, missingOrInvalid: 2, stale: false });
    const partial = { ...masjid, observedOn: null, prayers: masjid.prayers.map((prayer, index) => ({ ...prayer, observedOn: index === 0 ? "2026-11-20" : null })) };
    expect(getObservationFreshness([partial], now)).toMatchObject({ oldest: "2026-11-20", ageDays: 5, missingOrInvalid: 1 });
  });

  it("interprets an observation date using the India calendar day", () => {
    const justAfterIndiaMidnight = new Date("2026-11-24T18:31:00.000Z");
    const masjid = { ...masjids[0], prayers: masjids[0].prayers.map((prayer) => ({ ...prayer, observedOn: "2026-11-25" })) };
    expect(getObservationFreshness([masjid], justAfterIndiaMidnight).ageDays).toBe(0);
  });
});
