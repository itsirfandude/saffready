export type TimeFormat = "12h" | "24h";

export function formatTime(value: string | null | undefined, format: TimeFormat = "12h"): string {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "தெரியவில்லை · Not available";
  const [hour, minute] = value.split(":").map(Number);
  if (format === "24h") return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}
