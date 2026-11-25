import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JamaatCard } from "@/components/JamaatCard";
import { NextIqamahHero } from "@/components/NextIqamahHero";
import { MasjidList } from "@/components/MasjidList";
import { PrayerTimetable } from "@/components/PrayerTimetable";
import type { Masjid } from "@/src/types/masjid";
import type { DailyIqamah } from "@/src/lib/scheduling";
import type { NextIqamah } from "@/src/lib/next-iqamah";

const masjid: Masjid = { id: "test-masjid", name_ta: null, name_en: "Long Community Masjid Name", address_ta: null, lat: 11, lng: 76, prayers: [{ prayer: "isha", adhan: "19:00", iqamah: "19:35", observedOn: null, effectiveFrom: null, source: "noticeboard_photo", handwritten: false, unclear: false }] };
const at = new Date("2026-11-23T14:05:00Z");
const ongoing: DailyIqamah = { masjid, prayer: "isha", time: "19:35", at };
const next: NextIqamah = { ...ongoing, at: new Date(at.getTime() + 8 * 60_000 + 42_000), minutesRemaining: 9, tomorrow: false };

describe("Jamaat cards", () => {
  it("shows a concise minute countdown and accessible walking information", () => {
    const html = renderToStaticMarkup(<JamaatCard item={next} status="next" now={at} timeFormat="12h" travel={{ distanceKm: .3, adjustedDistanceKm: .39, walkMinutes: 5, bikeMinutes: 2, mode: "walk", minutes: 5 }} />);
    expect(html).toContain("9 min");
    expect(html).not.toContain("08:42");
    expect(html).not.toContain("TIME LEFT TO IQAMAH");
    expect(html).toContain("7:35 PM");
    expect(html).toContain("5 min walk · 390 m");
    expect(html).toContain("5 min walk");
    expect(html).toContain("minute walk");
    expect(html).toContain('aria-live="off">9 min');
    expect(html).toContain("jamaat-card-next");
  });

  it("updates the countdown from the supplied current time and marks ongoing cards", () => {
    const html = renderToStaticMarkup(<JamaatCard item={ongoing} status="ongoing" now={at} timeFormat="12h" travel={null} />);
    expect(html).toContain("நடைபெறுகிறது");
    expect(html).not.toContain("TIME LEFT TO IQAMAH");
    expect(html).not.toContain("00:00");
    expect(html).toContain("jamaat-card-ongoing");
    expect(html).toContain("Walking time unavailable");
    const nextHtml = renderToStaticMarkup(<JamaatCard item={next} status="next" now={new Date(at.getTime() + 1_000)} timeFormat="12h" travel={null} />);
    expect(nextHtml).toContain("9 min");
  });

  it("shows immediate Iqamah clock time, numerical countdown, and supporting labels", () => {
    const immediateMasjid = { ...masjid, prayers: [{ ...masjid.prayers[0], adhan: "17:55", iqamah: { type: "after_adhan" as const, offsetMin: 0 } }] };
    const immediateAt = new Date("2026-11-21T12:25:00Z");
    const beforeAdhan = new Date("2026-11-21T12:11:00Z");
    const immediateNext: NextIqamah = { ...next, masjid: immediateMasjid, time: "17:55", at: immediateAt, minutesRemaining: 14, immediate: true };
    const card = renderToStaticMarkup(<JamaatCard item={immediateNext} status="next" now={beforeAdhan} timeFormat="12h" travel={null} />);
    expect(card).toContain("5:55 PM");
    expect(card).toContain("14 min");
    expect(card).toContain("அதானுக்குப் பிறகு உடனே");
    expect(card).not.toContain("NaN");
    const hero = renderToStaticMarkup(<NextIqamahHero next={immediateNext} timeFormat="12h" />);
    expect(hero).toContain("5:55 PM");
    expect(hero).toContain("14 நிமி");
    expect(hero).toContain("அதானுக்குப் பிறகு உடனே");
    const timetable = renderToStaticMarkup(<PrayerTimetable masjid={immediateMasjid} timeFormat="12h" />);
    expect(timetable).toContain("5:55 PM");
    expect(timetable).toContain("அதானுக்குப் பிறகு உடனே");
  });

  it("shows the ending-soon status on cards and detail timetables", () => {
    const ending = { ...ongoing, at: new Date(at.getTime() - 6 * 60_000) };
    const card = renderToStaticMarkup(<JamaatCard item={ending} status="ending-soon" now={at} timeFormat="12h" travel={null} />);
    expect(card).toContain("முடிவடைய உள்ளது");
    expect(card).toContain("jamaat-card-ending-soon");
    const timetable = renderToStaticMarkup(<PrayerTimetable masjid={masjid} timeFormat="12h" statusByPrayer={{ isha: "ending-soon" }} />);
    expect(timetable).toContain("முடிவடைய உள்ளது");
  });

  it("renders full-width Next and Ongoing cards and initially limits Ongoing to two", () => {
    const manyOngoing = [ongoing, { ...ongoing, masjid: { ...masjid, id: "second" } }, { ...ongoing, masjid: { ...masjid, id: "third" } }];
    const nextItem = { ...next, masjid };
    const html = renderToStaticMarkup(<MasjidList items={[nextItem]} ongoing={manyOngoing} endingSoon={[]} timeFormat="12h" sortMode="next" onNext={() => {}} onDistance={() => {}} onUseLocation={() => {}} location={null} locationState="idle" now={at} />);
    expect(html).toContain("+1 more ongoing");
    expect((html.match(/jamaat-grid grid grid-cols-1 gap-3/g) ?? []).length).toBe(2);
    expect((html.match(/jamaat-card-ongoing/g) ?? []).length).toBe(2);
    expect(html).toContain("jamaat-card-next");
    expect(html).toContain('aria-label="என் இருப்பிடம்"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("மஸ்ஜித்கள்");
  });

  it("keeps time sorting grouped and renders distance sorting as a flat nearest-first list", () => {
    const second = { ...masjid, id: "second", name_en: "Second Masjid", lat: 12, lng: 78 };
    const farther = { ...next, masjid: second };
    const near = { ...next, masjid };
    const shared = { items: [near, farther], ongoing: [ongoing], endingSoon: [], timeFormat: "12h" as const, onNext: () => {}, onDistance: () => {}, onUseLocation: () => {}, location: { latitude: 11, longitude: 76 }, locationState: "ready" as const, now: at };
    const timeHtml = renderToStaticMarkup(<MasjidList {...shared} sortMode="next" />);
    expect(timeHtml.indexOf("நடைபெறும் Jamaat")).toBeLessThan(timeHtml.indexOf("அடுத்த Jamaat"));
    const distanceHtml = renderToStaticMarkup(<MasjidList {...shared} sortMode="distance" />);
    expect(distanceHtml).not.toContain("Ongoing Jamaat");
    expect(distanceHtml).not.toContain("Next Jamaat</h2>");
    expect(distanceHtml.indexOf("Long Community Masjid Name")).toBeLessThan(distanceHtml.indexOf("Second Masjid"));
    expect(distanceHtml).toContain("jamaat-status-chip");
    expect(distanceHtml).toContain("aria-pressed=\"true\"");
  });

  it("preserves hero prayer names, Masjid, scheduled time, timetable link, and walking distance", () => {
    const html = renderToStaticMarkup(<NextIqamahHero next={next} timeFormat="12h" travel={{ distanceKm: .3, adjustedDistanceKm: .39, walkMinutes: 5, bikeMinutes: 2, mode: "walk", minutes: 5 }} />);
    expect(html).toContain("அடுத்த இகாமத்");
    expect(html).toContain("Long Community Masjid Name");
    expect(html).toContain("7:35 PM");
    expect(html).toContain("சுமார் 5 நிமிட நடை · 390 m");
    expect(html).toContain("Timetable பார்க்க");
    expect(html).toContain("العشاء");
  });
});
