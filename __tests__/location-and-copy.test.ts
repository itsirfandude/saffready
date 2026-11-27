import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { copy } from "@/src/constants/strings";
import { locationFailureState } from "@/src/lib/location";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("optional location experience", () => {
  it("keeps geolocation out of initial effects and requests it only from the user action handler", () => {
    const source = read("components/ClientHome.tsx");
    const effects = source.match(/useEffect\([\s\S]*?\}, \[\]\);/g) ?? [];
    expect(effects.join("\n")).not.toContain("getCurrentPosition");
    const handler = source.slice(source.indexOf("const requestLocation ="), source.indexOf("const entry ="));
    expect(handler).toContain("navigator.geolocation.getCurrentPosition");
    expect(source).toContain("onUseLocation={() => requestLocation(false)}");
    expect(source).toContain("onDistance={() => requestLocation(true)}");
  });

  it("maps permission denial, timeouts, and other failures to neutral states", () => {
    expect(locationFailureState(1)).toBe("permission-denied");
    expect(locationFailureState(3)).toBe("timeout");
    expect(locationFailureState(2)).toBe("error");
    expect(copy("locationHint", "en")).toContain("optional");
    expect(copy("locationHint", "en")).toContain("walking time");
    expect(copy("locationHint", "en")).toContain("distance");
    expect(copy("retryLocation", "en")).toBe("Try location again");
    expect(copy("locationDenied", "en")).toContain("site settings");
    expect(copy("locationUnavailable", "en")).toContain("Prayer times remain available");
    expect(copy("locationUnsupported", "en")).toContain("cannot provide your location");
    expect(copy("locationHint", "ta")).toContain("விருப்பத்தேர்வு");
    expect(copy("retryLocation", "ta")).toContain("மீண்டும் முயற்சிக்கவும்");
    const hero = read("components/NextIqamahHero.tsx");
    expect(hero).toContain("{travel && <p");
    expect(hero).not.toContain("Walking details unavailable");
    const cards = read("components/JamaatCard.tsx");
    expect(cards).toContain('locationState === "ready"');
    expect(cards).not.toContain("Walking time unavailable");
    const list = read("components/MasjidList.tsx");
    expect(list).toContain("copy(\"locationHint\", language)");
    expect(list).toContain("copy(\"retryLocation\", language)");
    expect(list).toContain("copy(\"locationUnsupported\", language)");
  });
});

describe("timing copy and user-facing status", () => {
  it("keeps compact badges, contextual hero labels, and Salah captions distinct in both languages", () => {
    expect(copy("ongoing", "en")).toBe("Ongoing");
    expect(copy("endingSoon", "en")).toBe("Ending soon");
    expect(copy("ongoing", "ta")).toBe("நடைபெறுகிறது");
    expect(copy("endingSoon", "ta")).toBe("முடிவடைய உள்ளது");
    expect(copy("ongoingContext", "en")).toBe("Salah ongoing");
    expect(copy("endingSoonContext", "en")).toBe("Salah ending soon");
    expect(copy("ongoingContext", "ta")).toBe("தொழுகை நடைபெறுகிறது");
    expect(copy("endingSoonContext", "ta")).toBe("தொழுகை முடிவடைய உள்ளது");
    expect(copy("salahStatus", "en")).toBe("Salah status");
    expect(copy("salahStatus", "ta")).toBe("தொழுகை நிலை");
    expect(read("components/JamaatCard.tsx")).toContain('copy("ongoing", language)');
    expect(read("components/JamaatCard.tsx")).toContain('copy("salahStatus", language)');
    expect(read("components/PrayerTimetable.tsx")).toContain('copy(status === "ongoing" ? "ongoing" : "endingSoon", language)');
  });

  it("suppresses only the source-stale warning while retaining source freshness state", () => {
    expect(read("src/constants/strings.ts")).not.toContain("Timetable source reports that these timings may be stale.");
    expect(read("components/TimetableDataNotice.tsx")).toContain('if (dataSource === "source-stale") return null;');
    expect(read("components/PreferencesProvider.tsx")).toContain('setDataSource("source-stale")');
    expect(read("src/lib/freshness.ts")).toBeTruthy();
  });

  it("retains the offline app-shell cache and network failure fallback", () => {
    const worker = read("public/sw.js");
    expect(worker).toContain('const SHELL = ["/", "/manifest.webmanifest"]');
    expect(worker).toContain('cache.addAll(SHELL)');
    expect(worker).toContain('caches.match("/")');
    expect(worker).toContain('url.pathname.startsWith("/_next/static/")');
  });
});
