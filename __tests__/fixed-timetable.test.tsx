import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PrayerTimetable } from "@/components/PrayerTimetable";
import type { Masjid, PrayerKey } from "@/src/types/masjid";

const { getLanguage } = vi.hoisted(() => ({ getLanguage: vi.fn() }));
vi.mock("@/components/PreferencesProvider", () => ({ usePreferences: () => ({ language: getLanguage() }) }));

const prayerKeys: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"];
const base: Masjid = {
  id: "fixed-test", name_en: "Test Masjid", name_ta: null, address_ta: null, lat: null, lng: null,
  prayers: prayerKeys.map((prayer, index) => ({
    prayer, adhan: `${String(5 + index).padStart(2,"0")}:00`, iqamah: `${String(5 + index).padStart(2,"0")}:20`, observedOn: null, effectiveFrom: null,
    source: "noticeboard_photo", handwritten: false, unclear: false,
  })),
};
const render = (masjid: Masjid) => renderToStaticMarkup(<PrayerTimetable masjid={masjid} timeFormat="24h"/>);

describe("fixed timetable presentation", () => {
  beforeEach(() => getLanguage.mockReturnValue("en"));

  it("marks confirmed TRUE prayer names only, without fixed-row highlighting", () => {
    const masjid={...base,prayers:base.prayers.map((record,index)=>({...record,fixed:index===0||index===5?true:index===1?false:undefined}))};
    const html=render(masjid);
    expect(html).not.toContain("prayer-fixed-row");
    expect((html.match(/class="prayer-fixed-star"/g)||[])).toHaveLength(2);
    expect(html).toContain("<th scope=\"row\" class=\"p-2.5 font-normal\"><span class=\"text-sm\">Jumuah</span><span class=\"prayer-fixed-star\"");
    expect((html.match(/>●<\/span>/g)||[])).toHaveLength(2);
    expect(html).toContain('aria-label="Masjid-confirmed longstanding timing"');
    expect(html).not.toContain("Fixed year-round");
    expect(html).not.toMatch(/<td[^>]*>[^<]*★/);
  });

  it("shows the accurate English disclaimer only when a displayed prayer is confirmed", () => {
    const confirmed={...base,prayers:base.prayers.map((record)=>record.prayer==="asr"?{...record,fixed:true}:record)};
    expect(render(confirmed)).toContain("● Unchanged Salah timings as confirmed by the Masjid.");
    const unknown={...base,prayers:base.prayers.map((record)=>({...record,fixed:null}))};
    expect(render(unknown)).not.toContain("Unchanged Salah timings");
    const falseOnly={...base,prayers:base.prayers.map((record)=>({...record,fixed:false}))};
    expect(render(falseOnly)).not.toContain("Unchanged Salah timings");
  });

  it("shows the accurate Tamil disclaimer, including a legacy-safe TRUE check", () => {
    getLanguage.mockReturnValue("ta");
    const legacy={...base,prayers:base.prayers.map((record)=>({...record}))};
    expect(render(legacy)).not.toContain("மாறாத தொழுகை நேரங்கள் என மஸ்ஜிதால் உறுதிப்படுத்தப்பட்டுள்ளது.");
    const confirmed={...legacy,prayers:legacy.prayers.map((record)=>record.prayer==="jumuah"?{...record,fixed:true}:record)};
    expect(render(confirmed)).toContain("● மாறாத தொழுகை நேரங்கள் என மஸ்ஜிதால் உறுதிப்படுத்தப்பட்டுள்ளது.");
  });

  it("renders all six prayer rows and no row-level metadata for unconfirmed schedules", () => {
    const html=render(base);
    expect((html.match(/<tr/g)||[])).toHaveLength(7);
    expect(html).not.toContain("prayer-fixed-star");
    expect(html).not.toContain("prayer-fixed-row");
  });

  it("shows one gold bullet beside each of the six confirmed prayer names", () => {
    const allFixed={...base,prayers:base.prayers.map((record)=>({...record,fixed:true}))};
    const html=render(allFixed);
    expect((html.match(/class="prayer-fixed-star"/g)||[])).toHaveLength(6);
    expect(html).not.toContain("prayer-fixed-row");
    expect((html.match(/>●<\/span>/g)||[])).toHaveLength(6);
    expect(html).toContain("Jumuah");
  });
});
