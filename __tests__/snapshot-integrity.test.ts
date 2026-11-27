import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import snapshot from "@/data/masjids.json";
import { validateMasjids } from "@/src/lib/validation";

describe("generated timetable snapshot integrity", () => {
  it("contains unique IDs and exactly one record for each of the six prayers", () => {
    const ids = snapshot.masjids.map((masjid) => masjid.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(validateMasjids(snapshot.masjids)).toBe(true);
    for (const masjid of snapshot.masjids) {
      expect(new Set(masjid.prayers.map((prayer) => prayer.prayer)).size).toBe(6);
    }
  });

  it("keeps the on-disk snapshot identical to its imported representation", async () => {
    const generated = JSON.parse(await readFile("data/masjids.json", "utf8"));
    expect(generated).toEqual(snapshot);
  });
});
