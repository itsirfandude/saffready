import type { Masjid, PrayerKey } from "@/src/types/masjid";
import { PRAYER_ORDER } from "@/src/constants/prayers";

export type DailyIqamah = { masjid: Masjid; prayer: PrayerKey; time: string; at: Date; tomorrow?: boolean; immediate?: boolean };
export type JamaatStatus = "upcoming" | "ongoing" | "ending-soon" | "completed";
export function classifyJamaat(at: Date, now: Date): JamaatStatus {
  const elapsed = now.getTime() - at.getTime();
  if (elapsed < 0) return "upcoming";
  if (elapsed <= 5 * 60_000) return "ongoing";
  if (elapsed <= 10 * 60_000) return "ending-soon";
  return "completed";
}
export function resolveIqamah(record: Pick<Masjid["prayers"][number], "iqamah" | "adhan">): string | null {
  const validTime = (value: string | null | undefined): value is string => Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
  if(record.iqamah==="immediate" || (record.iqamah && typeof record.iqamah!=="string" && record.iqamah.type==="immediate")) return validTime(record.adhan)?record.adhan:null;
  if (typeof record.iqamah === "string") return validTime(record.iqamah) ? record.iqamah : null;
  if (!record.iqamah || !validTime(record.adhan) || !Number.isInteger(record.iqamah.offsetMin) || record.iqamah.offsetMin < 0 || record.iqamah.offsetMin > 120) return null;
  const [h,m]=record.adhan.split(":").map(Number), minutes=(h*60+m+record.iqamah.offsetMin)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
}
export function iqamahDayOffset(record: Pick<Masjid["prayers"][number], "iqamah" | "adhan">): number {
  if (!record.adhan || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.adhan)) return 0;
  const [hour, minute] = record.adhan.split(":").map(Number);
  const adhanMinutes = hour * 60 + minute;
  if (typeof record.iqamah === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(record.iqamah)) {
    const [iqamahHour, iqamahMinute] = record.iqamah.split(":").map(Number);
    const iqamahMinutes = iqamahHour * 60 + iqamahMinute;
    return iqamahMinutes < adhanMinutes && iqamahMinutes + 1440 - adhanMinutes <= 120 ? 1 : 0;
  }
  if (!record.iqamah || typeof record.iqamah === "string" || record.iqamah.type !== "after_adhan") return 0;
  return adhanMinutes + record.iqamah.offsetMin >= 1440 ? 1 : 0;
}
export function getDailyIqamahs(masjids: Masjid[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hour12:false}).formatToParts(now);
  const v=Object.fromEntries(parts.map(p=>[p.type,Number(p.value)]));
  const base=now.getTime(), wallDay=Date.UTC(v.year,v.month-1,v.day), friday=new Date(wallDay).getUTCDay()===5;
  const entries:DailyIqamah[]=[];
  for(const masjid of masjids) for(const prayer of PRAYER_ORDER){
    if((prayer==="dhuhr"&&friday)||(prayer==="jumuah"&&!friday)) continue;
    const record=masjid.prayers.find(p=>p.prayer===prayer), time=record&&resolveIqamah(record); if(!record||!time) continue;
    const [h,m]=time.split(":").map(Number), dayOffset=iqamahDayOffset(record); entries.push({masjid,prayer,time,at:new Date(Date.UTC(v.year,v.month-1,v.day+dayOffset,h,m)-330*60_000),tomorrow:dayOffset>0,immediate:record.iqamah==="immediate" || Boolean(record.iqamah && typeof record.iqamah!=="string" && (record.iqamah.type==="immediate" || record.iqamah.offsetMin===0))});
  }
  entries.sort((a,b)=>a.at.getTime()-b.at.getTime());
  const ongoing = entries.filter((entry) => classifyJamaat(entry.at, now) === "ongoing");
  const endingSoon = entries.filter((entry) => classifyJamaat(entry.at, now) === "ending-soon");
  const completed = entries.filter((entry) => classifyJamaat(entry.at, now) === "completed");
  const upcoming = entries.filter((entry) => entry.at.getTime() > base);
  if (upcoming.length === 0) {
    for (const masjid of masjids) {
      const fajr = masjid.prayers.find((prayer) => prayer.prayer === "fajr");
      const time = fajr && resolveIqamah(fajr);
      if (!time) continue;
      const [hour, minute] = time.split(":").map(Number);
      upcoming.push({ masjid, prayer: "fajr", time, at: new Date(Date.UTC(v.year, v.month - 1, v.day + 1 + iqamahDayOffset(fajr!), hour, minute) - 330 * 60_000), tomorrow: true, immediate: fajr!.iqamah === "immediate" || Boolean(fajr!.iqamah && typeof fajr!.iqamah !== "string" && (fajr!.iqamah.type === "immediate" || fajr!.iqamah.offsetMin === 0)) });
    }
    upcoming.sort((a, b) => a.at.getTime() - b.at.getTime());
  }
  return { ongoing, endingSoon, completed, upcoming };
}
