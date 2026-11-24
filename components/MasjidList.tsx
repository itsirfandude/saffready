import type { TimeFormat } from "@/src/lib/format-time";
import type { NextIqamah, UnavailableIqamah } from "@/src/lib/next-iqamah";
import { MasjidCard } from "@/components/MasjidCard";
import { usePreferences } from "@/components/PreferencesProvider";
import type { UserLocation } from "@/src/lib/distance";
import { travelForMasjid, isReachable } from "@/src/lib/travel";
import { copy } from "@/src/constants/strings";

type LocationState = "idle" | "loading" | "ready" | "error" | "permission-denied" | "timeout";

export function MasjidList({
  items, timeFormat, sortMode, onNext, onDistance, onUseLocation, location, locationState, now,
}: {
  items: (NextIqamah | UnavailableIqamah)[];
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
  const ta = language === "ta";
  const status = locationState === "loading" ? copy("locationLoading", language)
    : locationState === "permission-denied" ? copy("locationDenied", language)
      : locationState === "timeout" ? copy("locationTimedOut", language)
        : locationState === "error" ? copy("locationUnavailable", language) : "";

  return <section className="mt-0 min-w-0">
    <div className="mb-2 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-semibold">Masjids</h2>
        <p className="text-xs text-[var(--text-muted)]">{sortMode === "distance"
          ? (ta ? "straight-line distance அடிப்படையில்" : "Sorted by straight-line distance")
          : (ta ? "Next Iqamah அடிப்படையில்" : "Sorted by next Iqamah")}</p>
      </div>
      <span className="text-xs text-[var(--text-muted)]">{items.length}</span>
    </div>
    <div className="mb-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <button type="button" aria-pressed={sortMode === "next"} onClick={onNext} className={`min-h-11 px-1 ${sortMode === "next" ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>{ta ? "Next Iqamah" : "Next Iqamah"}</button>
      <button type="button" aria-pressed={sortMode === "distance"} onClick={onDistance} disabled={locationState === "loading"} className={`min-h-11 px-1 disabled:opacity-60 ${sortMode === "distance" ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>Distance</button>
      <button type="button" onClick={onUseLocation} disabled={locationState === "loading"} className="min-h-11 rounded-lg border border-[var(--accent-2)] px-3 font-semibold text-[var(--text)] disabled:opacity-60">{copy("useLocation", language)}</button>
      {!location && <span className="basis-full text-[11px] leading-4 text-[var(--text-muted)]">{copy("locationHint", language)}</span>}
      {status && <span role="status" aria-live="polite" className="text-[var(--text-muted)]">{status}</span>}
    </div>
    <div className="grid grid-cols-1 gap-2 min-[768px]:grid-cols-2">
      {items.map((item, index) => {
        const distanceKm = (item as NextIqamah & { distanceKm?: number }).distanceKm;
        const travel = location ? travelForMasjid(location, item.masjid) : null;
        const mayMiss = Boolean(location && travel && !("unavailable" in item) && !isReachable(now, item.at, travel.minutes));
        return <MasjidCard key={item.masjid.id} item={item} rank={index + 1} timeFormat={timeFormat} distanceKm={distanceKm} travel={travel} mayMiss={mayMiss} />;
      })}
    </div>
  </section>;
}
