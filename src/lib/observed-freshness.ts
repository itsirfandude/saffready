import type { Masjid } from "@/src/types/masjid";

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
  for (const masjid of masjids) {
    const observations = masjid.prayers.length
      ? masjid.prayers.map((prayer) => prayer.observedOn ?? masjid.observedOn ?? null)
      : [masjid.observedOn ?? null];
    const valid = observations.filter(isValidDate);
    dates.push(...valid);
    if (valid.length === 0 || observations.some((date) => !isValidDate(date))) missingOrInvalid++;
  }
  const oldest = dates.sort()[0] ?? null;
  const today = new Date(`${istDate(now)}T00:00:00Z`).getTime();
  const ageDays = oldest ? Math.max(0, Math.floor((today - new Date(`${oldest}T00:00:00Z`).getTime()) / 86400000)) : null;
  return { oldest, ageDays, stale: ageDays !== null && ageDays > 14, missingOrInvalid };
}
