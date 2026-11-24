export function daysSince(date: string, now = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 0;
  const observed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(observed.getTime()) || observed.toISOString().slice(0, 10) !== date) return 0;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const today = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((today - observed.getTime()) / 86400000));
}

export function freshnessLabel(date: string, now = new Date()): string {
  const days = daysSince(date, now);
  return days === 0 ? "இன்று · Today" : `Observed ${days} day${days === 1 ? "" : "s"} ago`;
}
