import type { Language } from "@/src/constants/strings";

/** Format a minute count compactly for countdowns and other durations. */
export function formatDuration(value: number | null | undefined, language: Language = "en"): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "";
  const minutes = Math.floor(value);
  if (minutes < 60) return language === "ta" ? `${minutes} நிமி` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return language === "ta"
    ? `${hours} மணி ${remainder} நிமி`
    : `${hours} h ${remainder} min`;
}
