import type { Masjid } from "@/src/types/masjid";
import { copy, type Language } from "@/src/constants/strings";

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function istDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getObservationFreshness(masjids: Masjid[], now = new Date()) {
  const dates: string[] = [];
  let missingOrInvalid = 0;
  const todayDate = istDate(now);
  const today = new Date(`${todayDate}T00:00:00Z`).getTime();
  for (const masjid of masjids) {
    const observations = masjid.prayers.length
      ? masjid.prayers.map((prayer) => prayer.observedOn ?? masjid.observedOn ?? null)
      : [masjid.observedOn ?? null];
    const valid = observations.filter((date): date is string => isValidDate(date) && date <= todayDate);
    dates.push(...valid);
    if (valid.length === 0 || observations.some((date) => !isValidDate(date) || date > todayDate)) missingOrInvalid++;
  }
  const latest = dates.sort().at(-1) ?? null;
  const ageDays = latest ? Math.max(0, Math.floor((today - new Date(`${latest}T00:00:00Z`).getTime()) / 86400000)) : null;
  return { latest, ageDays, stale: ageDays !== null && ageDays > 14, missingOrInvalid };
}

export function observationFreshnessMessage(date: string | null, ageDays: number | null, language: Language): string {
  if (!date || ageDays === null) return copy("observationUnavailable", language);
  const display = new Intl.DateTimeFormat(language === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(`${date}T00:00:00+05:30`));
  const age = ageDays === 0 ? copy("observationToday", language) : `${ageDays} ${language === "ta" ? "நாட்களுக்கு முன்" : `day${ageDays === 1 ? "" : "s"} ago`}`;
  return copy("oldestObservationCompact", language).replace("{date}", display).replace("{age}", age);
}
