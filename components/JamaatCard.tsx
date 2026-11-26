import Link from "next/link";
import type { DailyIqamah } from "@/src/lib/scheduling";
import type { NextIqamah } from "@/src/lib/next-iqamah";
import type { TimeFormat } from "@/src/lib/format-time";
import { formatTime } from "@/src/lib/format-time";
import { formatIqamahValue, formatImmediateIqamahLabel, isImmediateIqamah } from "@/src/lib/format-iqamah";
import { masjidName } from "@/src/lib/masjid-name";
import { usePreferences } from "@/components/PreferencesProvider";
import type { TravelEstimate } from "@/src/lib/travel";
import { formatCountdown, minutesUntil } from "@/src/lib/countdown";
import { PRAYER_TA, PRAYER_EN } from "@/src/constants/prayers";
import { copy } from "@/src/constants/strings";

export function JamaatCard({
  item, status, now, timeFormat, travel,
}: {
  item: DailyIqamah | NextIqamah;
  status: "ongoing" | "ending-soon" | "next";
  now: Date;
  timeFormat: TimeFormat;
  travel: TravelEstimate | null;
}) {
  const { language } = usePreferences();
  const ta = language === "ta";
  const name = masjidName(item.masjid, language);
  const record = item.masjid.prayers.find((prayer) => prayer.prayer === item.prayer);
  const iqamahTime = record ? formatIqamahValue(record.iqamah, record.adhan, language, timeFormat) : formatTime(item.time, timeFormat);
  const countdown = formatCountdown(minutesUntil(item.at, now));
  const immediate = record ? isImmediateIqamah(record.iqamah) : false;
  const prayerName = ta ? PRAYER_TA[item.prayer] : PRAYER_EN[item.prayer];
  const tone = status === "ongoing" ? "jamaat-card-ongoing" : status === "ending-soon" ? "jamaat-card-ending-soon" : "jamaat-card-next";

  const isActive = status === "ongoing" || status === "ending-soon";
  const statusLabel = status === "ongoing" ? copy("ongoing", language) : status === "ending-soon" ? copy("endingSoon", language) : (ta ? "வரவிருக்கிறது" : "Upcoming");
  return <Link href={`/masjid/${item.masjid.id}`} className={`jamaat-card ${tone}`} aria-label={`${name}, ${prayerName}, ${iqamahTime}, ${isActive ? statusLabel : `${countdown} until Iqamah`}, ${travel ? `${travel.walkMinutes} minute walk, ${Math.round(travel.adjustedDistanceKm * 1000)} meters` : "Walking time unavailable"}`}>
    <div className="jamaat-card-top"><p className={`jamaat-card-name ${ta ? "font-tamil-text" : ""}`}>{name}</p><p className="jamaat-prayer-name">{prayerName}</p></div>
    <div className="jamaat-card-main">
      <p className="jamaat-iqamah-time">{iqamahTime}</p>
      {immediate && <p className="text-xs text-[var(--text-muted)]">{formatImmediateIqamahLabel(language)}</p>}
      <div className="jamaat-countdown"><p aria-live="off">{isActive ? <span className="jamaat-status-chip">{statusLabel}</span> : countdown}</p><span>{isActive ? copy("salahStatus", language) : ta ? "இகாமத்துக்கு" : "until Iqamah"}</span></div>
    </div>
    {status === "next" && <span className="sr-only jamaat-status-chip">{statusLabel}</span>}
    <div className="jamaat-card-meta" aria-label={travel ? `${travel.walkMinutes} min walk · ${Math.round(travel.adjustedDistanceKm * 1000)} m` : ta ? "நடை நேரம்: இருப்பிடம் தேவை" : "Walking time unavailable · use location"}>
      <span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>{travel ? `${Math.round(travel.adjustedDistanceKm * 1000)} m` : (ta ? "தூரம் —" : "Distance —")}</span>
      <span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="m10 22 1-7-3 2-2-3 4-4 4 2 3 5h-3l-2-3-1 8M7 9l-3 3"/></svg>{travel ? `${travel.walkMinutes} min walk` : (ta ? "நடை நேரம் கிடைக்கவில்லை" : "Walk time unavailable")}</span>
    </div>
  </Link>;
}
