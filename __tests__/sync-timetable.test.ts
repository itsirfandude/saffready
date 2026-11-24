import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { masjids } from "@/src/lib/data";
import { syncTimetable } from "../scripts/sync-timetable.mjs";

const directories: string[] = [];
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "saffready-sync-"));
  directories.push(dir);
  return join(dir, "masjids.json");
}
afterEach(async () => { await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

const makePayload = (version: number, additions: number[] = []) => ({
  version,
  publishedAt: `2026-11-24T10:00:0${version % 10}.000Z`,
  timezone: "Asia/Kolkata",
  sourceStale: false,
  masjids: [...masjids.slice(0, 13), ...additions.map((n) => ({ ...masjids[0], id: `future-${n}` }))],
});
const response = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

describe("Google Sheets timetable sync", () => {
  it("writes the complete validated publisher snapshot and metadata atomically", async () => {
    const outputPath = await fixture();
    const payload = makePayload(11, [1, 2]);
    const result = await syncTimetable({ endpoint: "https://example.test/exec", outputPath, fetchImpl: async () => response(payload), now: () => 123 });
    expect(result).toEqual({ version: 11, masjidCount: 15 });
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(payload);
    await expect(readdir(dirname(outputPath))).resolves.toEqual(["masjids.json"]);
  });

  it("leaves local data untouched for invalid JSON, invalid datasets, and stale sources", async () => {
    for (const invalidResponse of [
      { ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } },
      response({ ...makePayload(12), masjids: [] }),
      response({ ...makePayload(12), sourceStale: true }),
    ]) {
      const outputPath = await fixture();
      const original = JSON.stringify(makePayload(10));
      await writeFile(outputPath, original);
      await expect(syncTimetable({ endpoint: "https://example.test/exec", outputPath, fetchImpl: async () => invalidResponse as Response })).rejects.toThrow();
      expect(await readFile(outputPath, "utf8")).toBe(original);
    }
  });

  it("leaves local data untouched when the request fails", async () => {
    const outputPath = await fixture();
    const original = JSON.stringify(makePayload(10));
    await writeFile(outputPath, original);
    await expect(syncTimetable({ endpoint: "https://example.test/exec", outputPath, fetchImpl: async () => { throw new Error("offline"); } })).rejects.toThrow("offline");
    expect(await readFile(outputPath, "utf8")).toBe(original);
  });

  it("does not replace the target when the atomic rename fails", async () => {
    const outputPath = await fixture();
    const original = JSON.stringify(makePayload(10));
    await writeFile(outputPath, original);
    await expect(syncTimetable({
      endpoint: "https://example.test/exec", outputPath, fetchImpl: async () => response(makePayload(11)), now: () => 456,
      renameImpl: async () => { throw new Error("rename failed"); },
    })).rejects.toThrow("rename failed");
    expect(await readFile(outputPath, "utf8")).toBe(original);
  });

  it("prevents an older numeric publisher version replacing newer local data", async () => {
    const outputPath = await fixture();
    const original = JSON.stringify(makePayload(12));
    await writeFile(outputPath, original);
    await expect(syncTimetable({ endpoint: "https://example.test/exec", outputPath, fetchImpl: async () => response(makePayload(11)) })).rejects.toThrow("older than local version");
    expect(await readFile(outputPath, "utf8")).toBe(original);
  });
});
