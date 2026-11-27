import { afterEach, describe, expect, it, vi } from "vitest";
import snapshot from "@/data/masjids.json";

vi.mock("next/cache", () => ({ unstable_cache: (callback: (...args: any[]) => any) => callback }));

import { getTimetableWithFallback } from "@/src/lib/server-timetable";

const endpoint = "https://publisher.example.test/timetable.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("server timetable fallback", () => {
  it("returns valid live data unchanged as the primary source", async () => {
    const liveMasjid = structuredClone(snapshot.masjids[0]);
    liveMasjid.name_en = "Publisher live name";
    liveMasjid.prayers[0].adhan = "05:11";
    const liveFeed = {
      version: "live-version",
      publishedAt: "2026-11-27T08:00:00.000Z",
      sourceStale: false,
      masjids: [liveMasjid],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => liveFeed });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTimetableWithFallback(endpoint);

    expect(fetchMock).toHaveBeenCalledWith(endpoint, { cache: "no-store" });
    expect(result).toMatchObject(liveFeed);
    expect(result.masjids).toEqual([liveMasjid]);
  });

  it.each([
    ["network failures", () => Promise.reject(new Error("network unavailable"))],
    ["unavailable publisher responses", () => Promise.resolve({ ok: false, json: async () => ({}) })],
  ])("uses the unchanged bundled snapshot after %s", async (_scenario, response) => {
    vi.stubGlobal("fetch", vi.fn(response));

    const result = await getTimetableWithFallback(endpoint);

    expect(result.masjids).toEqual(snapshot.masjids);
    expect(result.version).toBe(snapshot.version);
    expect(result.publishedAt).toBe(snapshot.publishedAt);
    expect(result.sourceStale).toBe(true);
  });
});
