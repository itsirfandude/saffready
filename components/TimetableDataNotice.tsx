"use client";
import { usePreferences } from "@/components/PreferencesProvider";
import { copy } from "@/src/constants/strings";

export function TimetableDataNotice({ className = "" }: { className?: string }) {
  const { language, dataStale, dataSource, lastDataUpdate } = usePreferences();
  if (!dataStale && dataSource !== "bundled") return null;
  const publishedDate = lastDataUpdate && Number.isFinite(Date.parse(lastDataUpdate))
    ? new Intl.DateTimeFormat(language === "ta" ? "ta-IN" : "en-IN", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
    }).format(new Date(lastDataUpdate))
    : lastDataUpdate || "—";
  const message = dataSource === "bundled"
    ? copy("timetableBundled", language)
    : dataSource === "source-stale"
    ? copy("timetableSourceStale", language).replace("{date}", publishedDate)
    : dataSource === "cached"
      ? copy("timetableCached", language).replace("{date}", publishedDate)
      : dataSource === "expired"
        ? copy("timetableCacheExpired", language)
        : copy("timetableUnavailable", language);

  return <p role="status" className={`font-medium stale-label ${className}`.trim()}>{message}</p>;
}
