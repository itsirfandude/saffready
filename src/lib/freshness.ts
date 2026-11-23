export function daysSince(date: string, now = new Date()): number {
  const observed = new Date(`${date}T00:00:00+05:30`).getTime();
  return Math.max(0, Math.floor((now.getTime() - observed) / 86400000));
}

export function freshnessLabel(date: string, now = new Date()): string {
  const days = daysSince(date, now);
  return days === 0 ? "இன்று · Today" : `Observed ${days} day${days === 1 ? "" : "s"} ago`;
}
