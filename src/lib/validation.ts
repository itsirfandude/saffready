import type { Masjid } from "@/src/types/masjid";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validateMasjids(value: unknown): value is Masjid[] {
  if (!Array.isArray(value)) return false;
  return value.every((masjid) => {
    if (!masjid || typeof masjid !== "object") return false;
    const item = masjid as Masjid;
    const validCoordinates = (item.lat === null && item.lng === null) || (typeof item.lat === "number" && item.lat >= -90 && item.lat <= 90 && typeof item.lng === "number" && item.lng >= -180 && item.lng <= 180);
    return Boolean(item.id && item.name_ta && item.name_en && validCoordinates && (item.affiliation === undefined || item.affiliation === null || typeof item.affiliation === "string") && (item.mapsUrl === undefined || item.mapsUrl === null || typeof item.mapsUrl === "string") && Array.isArray(item.prayers) && item.prayers.every((record) => {
      const iqamah = record.iqamah;
      const validIqamah = iqamah === null || (typeof iqamah === "string" && TIME.test(iqamah)) || (typeof iqamah === "object" && iqamah.type === "after_adhan" && typeof iqamah.offsetMin === "number");
      return Boolean(record.prayer && (record.adhan === null || TIME.test(record.adhan)) && validIqamah && (record.observedOn === null || /^\\d{4}-\\d{2}-\\d{2}$/.test(record.observedOn)) && record.source === "noticeboard_photo");
    }));
  });
}
