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

  it("highlights confirmed TRUE rows only and places one star beside each prayer name", () => {
    const masjid={...base,prayers:base.prayers.map((record,index)=>({...record,fixed:index===0||index===5?true:index===1?false:undefined}))};
    const html=render(masjid);
    expect(html).toContain("prayer-fixed-row");
    expect((html.match(/prayer-fixed-row/g)||[])).toHaveLength(2);
    expect((html.match(/class="prayer-fixed-star"/g)||[])).toHaveLength(2);
    expect(html).toContain("<th scope=\"row\" class=\"p-2.5 font-normal\"><span class=\"text-sm\">Jumuah</span><span class=\"prayer-fixed-star\"");
    expect(html).toContain('aria-label="Masjid-confirmed longstanding timing"');
    expect(html).not.toContain("Fixed year-round");
    expect(html).not.toMatch(/<td[^>]*>[^<]*★/);
  });

  it("shows the accurate English disclaimer only when a displayed prayer is confirmed", () => {
    const confirmed={...base,prayers:base.prayers.map((record)=>record.prayer==="asr"?{...record,fixed:true}:record)};
    expect(render(confirmed)).toContain("★ Longstanding Salah timings confirmed by the Masjid. Timings may change.");
    const unknown={...base,prayers:base.prayers.map((record)=>({...record,fixed:null}))};
    expect(render(unknown)).not.toContain("Longstanding Salah timings");
    const falseOnly={...base,prayers:base.prayers.map((record)=>({...record,fixed:false}))};
    expect(render(falseOnly)).not.toContain("Longstanding Salah timings");
  });

  it("shows the accurate Tamil disclaimer, including a legacy-safe TRUE check", () => {
    getLanguage.mockReturnValue("ta");
    const legacy={...base,prayers:base.prayers.map((record)=>({...record}))};
    expect(render(legacy)).not.toContain("மஸ்ஜித் உறுதிப்படுத்திய நீண்டகால தொழுகை நேரங்கள்");
    const confirmed={...legacy,prayers:legacy.prayers.map((record)=>record.prayer==="jumuah"?{...record,fixed:true}:record)};
    expect(render(confirmed)).toContain("★ மஸ்ஜித் உறுதிப்படுத்திய நீண்டகால தொழுகை நேரங்கள். நேரங்கள் மாறக்கூடும்.");
  });

  it("renders all six prayer rows and no row-level metadata for unconfirmed schedules", () => {
    const html=render(base);
    expect((html.match(/<tr/g)||[])).toHaveLength(7);
    expect(html).not.toContain("prayer-fixed-star");
    expect(html).not.toContain("prayer-fixed-row");
  });

  it("applies row highlighting and one prayer-name star across all six confirmed rows", () => {
    const allFixed={...base,prayers:base.prayers.map((record)=>({...record,fixed:true}))};
    const html=render(allFixed);
    expect((html.match(/class="prayer-fixed-star"/g)||[])).toHaveLength(6);
    expect((html.match(/prayer-fixed-row/g)||[])).toHaveLength(6);
    expect(html).toContain("Jumuah");
  });
});
