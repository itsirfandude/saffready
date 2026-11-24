import type { Masjid, PrayerKey, PrayerRecord } from "@/src/types/masjid";
import { PRAYER_ORDER } from "@/src/constants/prayers";

export interface NextIqamah {
  masjid: Masjid;
  prayer: PrayerKey;
  time: string;
  at: Date;
  minutesRemaining: number;
  tomorrow: boolean;
}

export interface UnavailableIqamah { masjid: Masjid; unavailable: true }

function validTime(value: string | null | undefined): value is string {
  return Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function resolvedTime(record: PrayerRecord): string | null {
  if (typeof record.iqamah === "string" && validTime(record.iqamah)) return record.iqamah;
  if (record.iqamah && typeof record.iqamah !== "string" && validTime(record.adhan)) {
    const [h, m] = record.adhan!.split(":").map(Number);
    const total = h * 60 + m + record.iqamah.offsetMin;
    return `${String(Math.floor((total % 1440) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return null;
}

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
    const time = record ? resolvedTime(record) : null;
    if (!time) return [];
    const dayOffset = 0;
    const at = istDate(now, dayOffset, time);
    if (prayer === "dhuhr" && isFriday) return [];
    if (prayer === "jumuah" && !isFriday) return [];
    if (at.getTime() > now.getTime()) return [{ prayer, time, at, dayOffset }];
    return [];
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
  const next = candidates[0] ?? (() => {
    const record = masjid.prayers.find((item) => item.prayer === "fajr");
    const time = record ? resolvedTime(record) : null;
    return time ? { prayer: "fajr" as PrayerKey, time, at: istDate(now, 1, time), dayOffset: 1 } : null;
  })();
  if (!next) return { masjid, unavailable: true };
  return { masjid, prayer: next.prayer, time: next.time, at: next.at, minutesRemaining: Math.max(0, Math.ceil((next.at.getTime() - now.getTime()) / 60000)), tomorrow: next.dayOffset > 0 };
}

export function getAllNextIqamah(masjids: Masjid[], now = new Date()) {
  return masjids.map((masjid) => getNextIqamah(masjid, now)).sort((a, b) => {
    if ("unavailable" in a) return 1;
    if ("unavailable" in b) return -1;
    return a.at.getTime() - b.at.getTime();
  });
}
