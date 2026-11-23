import type { PrayerKey } from "@/src/types/masjid";

export const PRAYER_TA = {
  fajr: "ஃபஜ்ர்",
  dhuhr: "துஹர்",
  asr: "அஸர்",
  maghrib: "மஃரிப்",
  isha: "இஷா",
  jumuah: "ஜுமுஆ",
} as const;

export const PRAYER_AR = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
} as const;

export const PRAYER_ORDER: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"];
