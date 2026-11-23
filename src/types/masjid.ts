export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "jumuah";

export type IqamahValue = string | { type: "after_adhan"; offsetMin: number } | null;

export interface PrayerRecord {
  prayer: PrayerKey;
  adhan: string | null;
  iqamah: IqamahValue;
  observedOn: string | null;
  effectiveFrom: string | null;
  source: "noticeboard_photo";
  handwritten: boolean;
  unclear: boolean;
}

export interface Masjid {
  id: string;
  name_ta: string;
  name_en: string;
  address_ta: string | null;
  lat: number | null;
  lng: number | null;
  affiliation?: string | null;
  mapsUrl?: string | null;
  prayers: PrayerRecord[];
}
