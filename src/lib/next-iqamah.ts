import type { Masjid, PrayerKey } from "@/src/types/masjid";
import { PRAYER_ORDER } from "@/src/constants/prayers";
import { iqamahDayOffset, resolveIqamah } from "@/src/lib/scheduling";

export interface NextIqamah {
  masjid: Masjid;
  prayer: PrayerKey;
  time: string;
  at: Date;
  minutesRemaining: number;
  tomorrow: boolean;
  immediate?: boolean;
}

export interface UnavailableIqamah { masjid: Masjid; unavailable: true }

function indiaCalendarParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: false }).formatToParts(now);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as Record<string, number>;
}

function istDate(now: Date, dayOffset: number, time: string): Date {
  const parts = indiaCalendarParts(now);
  const [hours, minutes] = time.split(":").map(Number);
  // Build the absolute instant for a Coimbatore wall-clock time (UTC+05:30).
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset, hours, minutes) - 330 * 60_000);
}

export function getNextIqamah(masjid: Masjid, now = new Date()): NextIqamah | UnavailableIqamah {
  const parts = indiaCalendarParts(now);
  const calendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const isFriday = calendarDate.getUTCDay() === 5;
  const candidates = PRAYER_ORDER.flatMap((prayer) => {
    const record = masjid.prayers.find((item) => item.prayer === prayer);
    const time = record ? resolveIqamah(record) : null;
    if (!time) return [];
    const dayOffset = record ? iqamahDayOffset(record) : 0;
    const at = istDate(now, dayOffset, time);
    if (prayer === "dhuhr" && isFriday) return [];
    if (prayer === "jumuah" && !isFriday) return [];
    if (at.getTime() > now.getTime()) return [{ prayer, time, at, dayOffset, immediate: record?.iqamah==="immediate" || Boolean(record?.iqamah && typeof record.iqamah!=="string" && (record.iqamah.type==="immediate" || record.iqamah.offsetMin===0)) }];
    return [];
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
  const next = candidates[0] ?? (() => {
    const record = masjid.prayers.find((item) => item.prayer === "fajr");
    const time = record ? resolveIqamah(record) : null;
    const dayOffset = record ? 1 + iqamahDayOffset(record) : 1;
    return time ? { prayer: "fajr" as PrayerKey, time, at: istDate(now, dayOffset, time), dayOffset, immediate: record?.iqamah==="immediate" || Boolean(record?.iqamah && typeof record.iqamah!=="string" && (record.iqamah.type==="immediate" || record.iqamah.offsetMin===0)) } : null;
  })();
  if (!next) return { masjid, unavailable: true };
  return { masjid, prayer: next.prayer, time: next.time, at: next.at, minutesRemaining: Math.max(0, Math.ceil((next.at.getTime() - now.getTime()) / 60000)), tomorrow: next.dayOffset > 0, immediate: next.immediate };
}

export function getAllNextIqamah(masjids: Masjid[], now = new Date()) {
  return masjids.map((masjid) => getNextIqamah(masjid, now)).sort((a, b) => {
    if ("unavailable" in a) return 1;
    if ("unavailable" in b) return -1;
    return a.at.getTime() - b.at.getTime();
  });
}
