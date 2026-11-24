import Link from "next/link";
import { PRAYER_TA, PRAYER_EN } from "@/src/constants/prayers";
import { formatTime, type TimeFormat } from "@/src/lib/format-time";
import type { NextIqamah, UnavailableIqamah } from "@/src/lib/next-iqamah";
import { RosetteBadge } from "@/components/RosetteBadge";
import { formatDistance } from "@/src/lib/distance";
import { usePreferences } from "@/components/PreferencesProvider";
import { formatIqamahValue } from "@/src/lib/format-iqamah";
import { formatDuration } from "@/src/lib/format-duration";
import { copy } from "@/src/constants/strings";
import type { TravelEstimate } from "@/src/lib/travel";
import { masjidName } from "@/src/lib/masjid-name";
import { buildMasjidCardAccessibleLabel } from "@/src/lib/masjid-card-accessibility";

export function MasjidCard({
  item, rank, timeFormat, distanceKm, travel, mayMiss = false,
}: {
  item: NextIqamah | UnavailableIqamah;
  rank: number;
  timeFormat: TimeFormat;
  distanceKm?: number;
  travel?: TravelEstimate | null;
  mayMiss?: boolean;
}) {
  const { language } = usePreferences();
  const ta = language === "ta";
  const name = masjidName(item.masjid, language);
  const travelText = travel ? copy(travel.mode, language).replace("{n}", String(travel.minutes)) : "";

  if ("unavailable" in item) {
    return <div className="ink-card flex min-h-[72px] items-center gap-3 rounded-xl px-3 py-2">
      <RosetteBadge rank={rank} />
      <div className="min-w-0">
        <p className={`whitespace-normal break-words font-semibold leading-snug ${ta ? "font-tamil-text text-base" : "text-sm"}`}>{name}</p>
        <p className="text-xs text-[var(--text-muted)]">{ta ? "Timings கிடைக்கவில்லை" : "Timings unavailable"}</p>
      </div>
    </div>;
  }

  const record = item.masjid.prayers.find((prayer) => prayer.prayer === item.prayer);
  const prayerName = ta ? PRAYER_TA[item.prayer] : PRAYER_EN[item.prayer];
  const iqamahTime = record ? formatIqamahValue(record.iqamah, record.adhan, language, timeFormat) : formatTime(item.time, timeFormat);
  const duration = formatDuration(item.minutesRemaining, language);
  const accessible = buildMasjidCardAccessibleLabel({ name, prayer: prayerName, iqamahTime, minutesRemaining: item.minutesRemaining, travel, mayMiss, language });

  return <Link
    href={`/masjid/${item.masjid.id}`}
    aria-label={accessible}
    className={`ink-card flex min-h-[126px] items-start gap-3 rounded-xl px-3 py-3 transition-transform hover:-translate-y-0.5 ${mayMiss ? "bg-[color-mix(in_srgb,var(--bg-card)_72%,var(--bg)_28%)]" : ""}`}
  >
    <RosetteBadge rank={rank} />
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className={`min-w-0 flex-1 whitespace-normal break-words font-semibold leading-snug ${ta ? "font-tamil-text text-base" : "text-sm"}`}>{name}</p>
        <p className={`shrink-0 whitespace-normal ${ta ? "font-tamil-text text-sm" : "text-sm"}`}>{prayerName}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2">
        <div>
          <p className="whitespace-nowrap text-xl font-semibold leading-6 text-[var(--accent)]">{iqamahTime}</p>
          {distanceKm !== undefined && <p className="text-[11px] text-[var(--text-muted)]">{formatDistance(distanceKm)}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold leading-5">{duration}{item.tomorrow && <span> · {copy("tomorrow", language)}</span>}</p>
          <p className="text-[11px] leading-4 text-[var(--text-muted)]">{copy("untilIqamah", language)}</p>
        </div>
      </div>
      {(travel || mayMiss) && <div className="mt-1 flex min-h-5 flex-wrap items-center justify-between gap-x-3 text-xs">
        {travel ? <span className="text-[var(--text-muted)]"><span aria-hidden="true">{travel.mode === "bike" ? "🚲" : "♙"}</span> {travelText}</span> : <span />}
        {mayMiss && <span className="font-semibold stale-label">{copy("mayMiss", language)}</span>}
      </div>}
    </div>
  </Link>;
}
