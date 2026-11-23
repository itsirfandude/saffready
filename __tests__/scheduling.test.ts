import {describe,expect,it} from "vitest";
import {masjids} from "@/src/lib/data";
import {getDailyIqamahs,resolveIqamah} from "@/src/lib/scheduling";
const one=masjids.find(m=>m.id==="masjidul-kousar")!;
describe("daily congregation classification",()=>{
 it("sorts upcoming and completed congregations at exact boundaries",()=>{const before=getDailyIqamahs([one],new Date("2026-11-23T07:29:00.000Z"));expect(before.completed.some(x=>x.prayer==="fajr")).toBe(true);expect(before.upcoming.find(x=>x.prayer==="dhuhr")?.time).toBe("13:00");const exact=getDailyIqamahs([one],new Date("2026-11-23T07:30:00.000Z"));expect(exact.completed.some(x=>x.prayer==="dhuhr")).toBe(true);expect(exact.upcoming.every(x=>x.at.getTime()>Date.parse("2026-11-23T07:30:00.000Z"))).toBe(true)});
 it("replaces Friday Dhuhr with Jumuah using Coimbatore date",()=>{const friday=getDailyIqamahs([one],new Date("2026-11-27T05:00:00.000Z"));expect(friday.upcoming.some(x=>x.prayer==="jumuah")).toBe(true);expect(friday.upcoming.some(x=>x.prayer==="dhuhr")).toBe(false);const monday=getDailyIqamahs([one],new Date("2026-11-23T05:00:00.000Z"));expect(monday.upcoming.some(x=>x.prayer==="jumuah")).toBe(false)});
 it("resolves immediate and offset-after-Adhan Iqamah without fabricated times",()=>{const maghrib=one.prayers.find(p=>p.prayer==="maghrib")!;expect(resolveIqamah(maghrib)).toBe("18:00");expect(resolveIqamah({...maghrib,iqamah:{type:"after_adhan",offsetMin:5}})).toBe("18:05")});
 it("starts the next day at Fajr after Isha",()=>{const result=getDailyIqamahs([one],new Date("2026-11-23T17:00:00Z"));expect(result.upcoming).toHaveLength(0);const after=getDailyIqamahs([one],new Date("2026-11-23T19:00:00Z"));expect(after.upcoming[0]?.time).toBe("05:35")});
});
