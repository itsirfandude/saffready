import type { Masjid } from "../types/masjid";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIMETABLE_SOURCES = new Set(["noticeboard_photo", "digital_timetable_photo"]);
export function validateMasjids(value: unknown): value is Masjid[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const ids=new Set<string>();
  return value.every((masjid) => {
    if (!masjid || typeof masjid !== "object") return false;
    const item = masjid as Masjid;
    const validCoordinates = (item.lat === null && item.lng === null) || (typeof item.lat === "number" && item.lat >= -90 && item.lat <= 90 && typeof item.lng === "number" && item.lng >= -180 && item.lng <= 180);
    return Boolean(item.id && (item.name_ta === null || typeof item.name_ta === "string") && item.name_en && validCoordinates && (item.affiliation === undefined || item.affiliation === null || typeof item.affiliation === "string") && (item.mapsUrl === undefined || item.mapsUrl === null || typeof item.mapsUrl === "string") && Array.isArray(item.prayers) && item.prayers.every((record) => {
      const iqamah = record.iqamah;
      const validIqamah = iqamah === null || (typeof iqamah === "string" && TIME.test(iqamah)) || (typeof iqamah === "object" && iqamah.type === "after_adhan" && Number.isInteger(iqamah.offsetMin) && iqamah.offsetMin >= 0 && iqamah.offsetMin <= 120);
      return Boolean(record.prayer && (record.adhan === null || TIME.test(record.adhan)) && validIqamah && (record.observedOn === null || /^\d{4}-\d{2}-\d{2}$/.test(record.observedOn)) && (record.effectiveFrom === null || /^\d{4}-\d{2}-\d{2}$/.test(record.effectiveFrom)) && TIMETABLE_SOURCES.has(record.source));
    }) && typeof item.id==="string" && !ids.has(item.id) && Boolean(ids.add(item.id)) && new Set(item.prayers.map(p=>p.prayer)).size===item.prayers.length && item.prayers.length===6);
  });
}
