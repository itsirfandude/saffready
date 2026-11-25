import Link from "next/link";
import { PRAYER_AR, PRAYER_TA, PRAYER_EN } from "@/src/constants/prayers";
import { formatTime, type TimeFormat } from "@/src/lib/format-time";
import type { NextIqamah } from "@/src/lib/next-iqamah";
import { usePreferences } from "@/components/PreferencesProvider";
import { formatDuration } from "@/src/lib/format-duration";
import { copy } from "@/src/constants/strings";
import type { TravelEstimate } from "@/src/lib/travel";
import { masjidName } from "@/src/lib/masjid-name";

export function NextIqamahHero({
  next, timeFormat, travel, mayMiss = false, showLocationHint = false, ongoing = false,
}: {
  next: NextIqamah;
  timeFormat: TimeFormat;
  travel?: TravelEstimate | null;
  mayMiss?: boolean;
  showLocationHint?: boolean;
  ongoing?: boolean;
}) {
  const { language } = usePreferences();
  const ta = language === "ta";
  const prayerName = ta ? PRAYER_TA[next.prayer] : PRAYER_EN[next.prayer];
  const name = masjidName(next.masjid, language);
  const travelText = travel ? copy("aboutWalk", language).replace("{n}", String(travel.walkMinutes)) : "";
  return <>
    <section className="rounded-2xl border border-[var(--accent)] bg-[var(--bg-raised)] p-5 shadow-[var(--raised-shadow)] sm:p-7">
      <p className="text-xs text-[var(--text-muted)]">{ongoing ? (ta ? "நடைபெறும் Jamaat" : "Ongoing Jamaat") : "Next Iqamah"}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div dir="ltr" className="min-w-0 flex-1">
          <p className="m-0 leading-[1.55]"><span dir="rtl" className="font-arabic-text inline-block text-left [unicode-bidi:isolate]">{PRAYER_AR[next.prayer as keyof typeof PRAYER_AR] ?? ""}</span></p>
          <p className={`whitespace-normal break-words ${ta ? "font-tamil-text text-base" : "text-sm font-medium"}`}>{prayerName}</p>
          <p className={`mt-0.5 whitespace-normal break-words font-semibold ${ta ? "font-tamil-text text-base" : "text-sm"}`}>{name}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]"><span aria-hidden="true">🚶 </span>{travel ? `${travelText} · ${Math.round(travel.adjustedDistanceKm * 1000)} m` : (ta ? "நடை நேரம் கிடைக்கவில்லை · இருப்பிடத்தைப் பயன்படுத்தவும்" : "Walking details unavailable · use your location")}</p>
          {mayMiss && <p className="mt-0.5 text-xs font-semibold stale-label">{copy("mayMiss", language)}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-semibold tracking-tight text-[var(--accent)] sm:text-4xl">{formatTime(next.time, timeFormat)}</p>
          <p className="mt-0.5 text-xs font-semibold text-[var(--accent)]">{ongoing ? (ta ? "நடைபெறுகிறது · 10 நிமிடக் காட்சி வகை" : "Ongoing · 10 minute display window") : next.tomorrow ? copy("tomorrow", language) : formatDuration(next.minutesRemaining, language)}</p>
        </div>
      </div>
      <Link href={`/masjid/${next.masjid.id}`} className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--bg)]">{ta ? "Timetable பார்க்க" : "View timetable"}</Link>
    </section>
    {showLocationHint && <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]" role="status">{copy("locationHint", language)}</p>}
  </>;
}
