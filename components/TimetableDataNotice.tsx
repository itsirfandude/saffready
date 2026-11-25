"use client";
import { usePreferences } from "@/components/PreferencesProvider";
import { copy } from "@/src/constants/strings";
import type { Language } from "@/src/constants/strings";

export function offlineTimetableNotice(offline: boolean, dataSource: string, language: Language): string | null {
  if (!offline) return null;
  const usingSaved = dataSource === "cached" || dataSource === "live" || dataSource === "source-stale";
  return language === "ta"
    ? usingSaved ? "இணையமில்லை · சேமித்த நேரங்கள்" : "இணையமில்லை · அடிப்படை நேரங்கள்"
    : usingSaved ? "Offline · showing saved timetable" : "Offline · using built-in timetable";
}

export function TimetableDataNotice({ className = "" }: { className?: string }) {
  const { language, dataStale, dataSource, offline } = usePreferences();
  const offlineNotice = offlineTimetableNotice(offline, dataSource, language);
  if (offlineNotice) return <>
    <p role="status" className={`font-medium text-[var(--text-muted)] ${className}`.trim()}>{offlineNotice}</p>
    {dataStale && dataSource === "source-stale" && <p role="status" className={`font-medium stale-label ${className}`.trim()}>{copy("timetableSourceStale", language)}</p>}
  </>;
  if (dataSource === "cached") return null;
  if (!dataStale && dataSource !== "bundled") return null;
  if ((dataSource === "bundled" || dataSource === "expired") && !offline) return null;
  const message = dataSource === "bundled"
    ? copy("timetableBundled", language)
    : dataSource === "source-stale"
    ? copy("timetableSourceStale", language)
    : dataSource === "expired"
        ? copy("timetableCacheExpired", language)
        : copy("timetableUnavailable", language);

  return <p role="status" className={`font-medium stale-label ${className}`.trim()}>{message}</p>;
}
