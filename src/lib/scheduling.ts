import type { Masjid, PrayerKey } from "@/src/types/masjid";
import { PRAYER_ORDER } from "@/src/constants/prayers";

export type DailyIqamah = { masjid: Masjid; prayer: PrayerKey; time: string; at: Date };
export function resolveIqamah(record: Masjid["prayers"][number]): string | null {
  if (typeof record.iqamah === "string") return record.iqamah;
  if (!record.iqamah || !record.adhan) return null;
  const [h,m]=record.adhan.split(":").map(Number), minutes=(h*60+m+record.iqamah.offsetMin)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
}
export function getDailyIqamahs(masjids: Masjid[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hour12:false}).formatToParts(now);
  const v=Object.fromEntries(parts.map(p=>[p.type,Number(p.value)]));
  const base=Date.UTC(v.year,v.month-1,v.day,v.hour%24,v.minute,v.second), friday=new Date(base).getUTCDay()===5;
  const entries:DailyIqamah[]=[];
  for(const masjid of masjids) for(const prayer of PRAYER_ORDER){
    if((prayer==="dhuhr"&&friday)||(prayer==="jumuah"&&!friday)) continue;
    const record=masjid.prayers.find(p=>p.prayer===prayer), time=record&&resolveIqamah(record); if(!record||!time) continue;
    const [h,m]=time.split(":").map(Number); entries.push({masjid,prayer,time,at:new Date(Date.UTC(v.year,v.month-1,v.day,h,m))});
  }
  entries.sort((a,b)=>a.at.getTime()-b.at.getTime());
  return { completed:entries.filter(e=>e.at.getTime()<=base), upcoming:entries.filter(e=>e.at.getTime()>base) };
}
