import type { TimeFormat } from "@/src/lib/format-time";
import type { NextIqamah, UnavailableIqamah } from "@/src/lib/next-iqamah";
import { useState } from "react";
import { JamaatCard } from "@/components/JamaatCard";
import type { DailyIqamah } from "@/src/lib/scheduling";
import { usePreferences } from "@/components/PreferencesProvider";
import type { UserLocation } from "@/src/lib/distance";
import { travelForMasjid } from "@/src/lib/travel";
import { copy } from "@/src/constants/strings";
import { formatDistance } from "@/src/lib/distance";

type LocationState = "idle" | "loading" | "ready" | "error" | "permission-denied" | "timeout";

export function MasjidList({
  items, ongoing, timeFormat, sortMode, onNext, onDistance, onUseLocation, location, locationState, now,
}: {
  items: (NextIqamah | UnavailableIqamah)[];
  ongoing: DailyIqamah[];
  timeFormat: TimeFormat;
  sortMode: "next" | "distance";
  onNext: () => void;
  onDistance: () => void;
  onUseLocation: () => void;
  location: UserLocation | null;
  locationState: LocationState;
  now: Date;
}) {
  const { language } = usePreferences();
  const [ongoingOpen, setOngoingOpen] = useState(false);
  const ta = language === "ta";
  const status = locationState === "loading" ? copy("locationLoading", language)
    : locationState === "permission-denied" ? copy("locationDenied", language)
      : locationState === "timeout" ? copy("locationTimedOut", language)
        : locationState === "error" ? copy("locationUnavailable", language) : "";

  return <div className="mt-0 min-w-0">
    <div className="mb-2 flex items-end justify-between gap-3">
      <h2 className="text-lg font-semibold leading-7">{ta ? "மஸ்ஜித்கள்" : "Masjids"}</h2>
      <span className="text-xs tabular-nums text-[var(--text-muted)]" aria-label={`${items.length} masjids`}>{items.length}</span>
    </div>
    <div role="group" aria-label={ta ? "வரிசை மற்றும் இருப்பிடக் கட்டுப்பாடுகள்" : "Sort and location controls"} className="mb-2 flex flex-wrap items-center gap-2 text-xs">
      <button type="button" aria-pressed={sortMode === "next"} onClick={onNext} className={`min-h-10 rounded-lg px-3 ${sortMode === "next" ? "border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg-card))] font-semibold text-[var(--accent)]" : "border border-[var(--border)] text-[var(--text-muted)]"}`}>{ta ? "அடுத்த இகாமத்" : "Next Iqamah"}</button>
      <button type="button" aria-pressed={sortMode === "distance"} onClick={onDistance} disabled={locationState === "loading"} className={`min-h-10 rounded-lg px-3 disabled:opacity-60 ${sortMode === "distance" ? "border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg-card))] font-semibold text-[var(--accent)]" : "border border-[var(--border)] text-[var(--text-muted)]"}`}>{ta ? "தூரம்" : "Distance"}</button>
      <button type="button" aria-label={copy("useLocation", language)} title={copy("useLocation", language)} onClick={onUseLocation} disabled={locationState === "loading"} className="flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-[var(--text)] disabled:opacity-60">
        {locationState === "loading" ? <span aria-hidden="true" className="animate-pulse text-lg">…</span> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>}
      </button>
    </div>
    {(status || !location) && <p role="status" aria-live="polite" className="mb-2 min-h-4 text-[11px] leading-5 text-[var(--text-muted)]">{status || copy("locationHint", language)}</p>}
    {sortMode === "next" && ongoing.length > 0 && <section aria-labelledby="ongoing-heading" className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="ongoing-heading" className="text-base font-semibold">{ta ? "நடைபெறும் Jamaat" : "Ongoing Jamaat"}</h2>
        {ongoing.length > 2 && <button type="button" aria-expanded={ongoingOpen} aria-controls="ongoing-jamaats" onClick={() => setOngoingOpen((open) => !open)} className="min-h-10 px-2 text-sm font-semibold text-[var(--accent)]">{ongoingOpen ? (ta ? "குறைவாகக் காட்டு" : "Show less") : `+${ongoing.length - 2} more ongoing`}</button>}
      </div>
      <div id="ongoing-jamaats" className="jamaat-grid grid grid-cols-1 gap-3">
        {(ongoingOpen ? ongoing : ongoing.slice(0, 2)).map((item) => <JamaatCard key={`${item.masjid.id}-${item.prayer}-${item.time}`} item={item} status="ongoing" now={now} timeFormat={timeFormat} travel={location ? travelForMasjid(location, item.masjid) : null} />)}
      </div>
    </section>}
    {sortMode === "next" && <section aria-labelledby="next-jamaat-heading" className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="next-jamaat-heading" className="text-base font-semibold">{ta ? "அடுத்த Jamaat" : "Next Jamaat"}</h2>
      </div>
    <div className="jamaat-grid grid grid-cols-1 gap-3">
      {items.map((item) => {
        const travel = location ? travelForMasjid(location, item.masjid) : null;
        if ("unavailable" in item) return <div key={item.masjid.id} className="ink-card rounded-xl px-3 py-3"><p className="break-words text-sm font-semibold">{item.masjid.name_en}</p><p className="text-xs text-[var(--text-muted)]">{ta ? "Timings கிடைக்கவில்லை" : "Timings unavailable"}</p></div>;
        return <JamaatCard key={`${item.masjid.id}-${item.prayer}`} item={item} status="next" now={now} timeFormat={timeFormat} travel={travel} />;
      })}
    </div>
    </section>}
    {sortMode === "distance" && <section aria-label={ta ? "தூர வரிசையில் உள்ள மஸ்ஜித்கள்" : "Masjids sorted by walking distance"} className="jamaat-grid grid grid-cols-1 gap-3">
      {items.map((item) => {
        const travel = location ? travelForMasjid(location, item.masjid) : null;
        if ("unavailable" in item) return <div key={item.masjid.id} className="ink-card min-w-0 rounded-xl px-3 py-3"><p className="break-words text-sm font-semibold">{item.masjid.name_en}</p><p className="jamaat-card-detail"><span className="jamaat-status-chip">{ta ? "நேரம் இல்லை" : "Unavailable"}</span><span>{ta ? "நடந்து செல்லும் தூரம் கிடைக்கவில்லை" : "Walking distance unavailable"}</span></p></div>;
        const key = `${item.masjid.id}:${item.prayer}:${item.time}`;
        const isOngoing = item.at.getTime() <= now.getTime() && now.getTime() - item.at.getTime() <= 10 * 60_000;
        return <div key={key} className="relative min-w-0"><JamaatCard item={item} status={isOngoing ? "ongoing" : "next"} now={now} timeFormat={timeFormat} travel={travel} />{travel ? <span className="distance-detail">{formatDistance(travel.adjustedDistanceKm)}</span> : <span className="distance-detail">{ta ? "தூரம் கிடைக்கவில்லை" : "Distance unavailable"}</span>}</div>;
      })}
    </section>}
  </div>;
}
