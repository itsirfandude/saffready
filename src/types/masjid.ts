export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "jumuah";

export type IqamahValue = string | { type: "after_adhan"; offsetMin: number } | null;

export interface PrayerRecord {
  prayer: PrayerKey;
  adhan: string | null;
  iqamah: IqamahValue;
  observedOn: string | null;
  effectiveFrom: string | null;
  source: "noticeboard_photo" | "digital_timetable_photo";
  handwritten: boolean;
  unclear: boolean;
  timingPattern?: TimingPattern;
}

export type TimingPattern = "fixed" | "seasonal" | "variable" | "unknown";

export interface Masjid {
  id: string;
  name_ta: string | null;
  name_en: string;
  address_ta: string | null;
  lat: number | null;
  lng: number | null;
  affiliation?: string | null;
  mapsUrl?: string | null;
  prayers: PrayerRecord[];
  mapsName?: string | null;
  active?: boolean;
  observedOn?: string | null;
  source?: string;
  notes?: string | null;
  timingPattern?: TimingPattern;
  updatedAt?: string | null;
  updatedBy?: string | null;
  additionalObservances?: { name_en: string; name_ta: string; time: string }[];
}
