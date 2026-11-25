export const COUNTDOWN_REFRESH_MS = 60_000;

export function formatCountdown(minutes: number): string {
  const value = Math.max(0, Math.ceil(minutes));
  if (value < 1) return "less than 1 min";
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return hours ? `${hours} h${remaining ? ` ${remaining} min` : ""}` : `${value} min`;
}

export function minutesUntil(at: Date, now: Date): number {
  return Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 60_000));
}
