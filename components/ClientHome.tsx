"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DailyContext } from "@/components/DailyContext";
import { MasjidList } from "@/components/MasjidList";
import { NextIqamahHero } from "@/components/NextIqamahHero";
import { TimetableDataNotice } from "@/components/TimetableDataNotice";
import { usePreferences } from "@/components/PreferencesProvider";
import { getAllNextIqamah, type NextIqamah } from "@/src/lib/next-iqamah";
import { getDailyIqamahs } from "@/src/lib/scheduling";
import { masjidName } from "@/src/lib/masjid-name";
import { sortByDistance, type UserLocation } from "@/src/lib/distance";
import { formatTime } from "@/src/lib/format-time";
import { formatIqamahValue } from "@/src/lib/format-iqamah";
import { PRAYER_TA, PRAYER_EN } from "@/src/constants/prayers";
import { QURAN_APP_PROMOTION } from "@/src/constants/app";
import { getObservationFreshness } from "@/src/lib/observed-freshness";
import { travelForMasjid, isReachable, type TravelEstimate } from "@/src/lib/travel";
import { copy } from "@/src/constants/strings";

type SortMode = "next" | "distance";
type LocationState = "idle" | "loading" | "ready" | "error" | "permission-denied" | "timeout";
const LOCATION_CACHE_KEY = "saffready-location-session";
const LOCATION_TTL_MS = 20 * 60_000;
type SessionLocation = { location: UserLocation; savedAt: number };

function getSessionLocation(): SessionLocation | null {
  try {
    const raw = sessionStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SessionLocation;
    const { latitude, longitude } = value.location;
    const age = Date.now() - value.savedAt;
    if (age < 0 || age > LOCATION_TTL_MS || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      sessionStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function rememberSessionLocation(location: UserLocation): SessionLocation {
  const value = { location, savedAt: Date.now() };
  try { sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(value)); } catch { /* In-memory reuse still works. */ }
  return value;
}

export function ClientHome() {
  const { timeFormat, language, masjids } = usePreferences();
  const ta = language === "ta";
  const [now, setNow] = useState(new Date());
  const [sortMode, setSortMode] = useState<SortMode>("next");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationSavedAt, setLocationSavedAt] = useState<number | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const id = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    const cached = getSessionLocation();
    if (cached) {
      setLocation(cached.location);
      setLocationSavedAt(cached.savedAt);
      setLocationState("ready");
    }
  }, []);

  useEffect(() => {
    if (locationSavedAt === null) return;
    const expiresIn = Math.max(0, LOCATION_TTL_MS - (Date.now() - locationSavedAt));
    const timer = setTimeout(() => {
      setLocation(null);
      setLocationSavedAt(null);
      setLocationState("idle");
      setSortMode("next");
      try { sessionStorage.removeItem(LOCATION_CACHE_KEY); } catch { /* Session storage may be disabled. */ }
    }, expiresIn);
    return () => clearTimeout(timer);
  }, [locationSavedAt]);

  const activeMasjids = masjids.filter((masjid) => masjid.active !== false);
  const nextItems = useMemo(() => getAllNextIqamah(activeMasjids, now), [activeMasjids, now]);
  const schedule = useMemo(() => getDailyIqamahs(activeMasjids, now), [activeMasjids, now]);
  const completed = schedule.completed;
  const freshness = getObservationFreshness(masjids, now);
  const locationAge = locationSavedAt === null ? Number.POSITIVE_INFINITY : Date.now() - locationSavedAt;
  const currentLocation = location && locationAge >= 0 && locationAge <= LOCATION_TTL_MS ? location : null;
  const ageDays = freshness.ageDays;
  const effectiveSortMode: SortMode = sortMode === "distance" && !currentLocation ? "next" : sortMode;
  const observationDate = freshness.oldest
    ? ageDays === 0 ? copy("observationToday", language)
      : new Intl.DateTimeFormat(ta ? "ta-IN" : "en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(`${freshness.oldest}T00:00:00+05:30`))
    : null;
  const freshnessText = observationDate !== null && ageDays !== null
    ? copy("oldestObservation", language).replace("{date}", observationDate).replace("{n}", String(ageDays))
    : copy("observationUnavailable", language);
  const available = nextItems.filter((item): item is NextIqamah => !("unavailable" in item));
  const reachable = currentLocation ? available.find((item) => {
    const travel = travelForMasjid(currentLocation, item.masjid);
    return travel !== null && isReachable(now, item.at, travel.minutes);
  }) : undefined;
  const next = reachable ?? available[0];
  const heroTravel: TravelEstimate | null = currentLocation && next ? travelForMasjid(currentLocation, next.masjid) : null;
  const heroMayMiss = Boolean(currentLocation && heroTravel && next && !isReachable(now, next.at, heroTravel.minutes));
  const directory = useMemo(
    () => effectiveSortMode === "distance" && currentLocation ? sortByDistance(nextItems, currentLocation) : nextItems,
    [currentLocation, effectiveSortMode, nextItems],
  );

  const requestLocation = (sortByLocation: boolean) => {
    if (sortByLocation) setSortMode("distance");
    const age = locationSavedAt === null ? Number.POSITIVE_INFINITY : Date.now() - locationSavedAt;
    const cached = location && age >= 0 && age <= LOCATION_TTL_MS;
    if (cached) { setLocationState("ready"); return; }
    setLocation(null);
    setLocationSavedAt(null);
    if (!navigator.geolocation) {
      setLocationState("error");
      if (sortByLocation) setSortMode("next");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition((position) => {
      const result = rememberSessionLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocation(result.location);
      setLocationSavedAt(result.savedAt);
      setLocationState("ready");
    }, (error) => {
      setLocationState(error.code === 1 ? "permission-denied" : error.code === 3 ? "timeout" : "error");
      if (sortByLocation) setSortMode("next");
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 0 });
  };

  const entry = (item: typeof completed[number]) => {
    const record = item.masjid.prayers.find((prayer) => prayer.prayer === item.prayer);
    return <Link href={`/masjid/${item.masjid.id}`} key={`${item.masjid.id}-${item.prayer}-${item.time}`} className="flex items-center justify-between gap-3 border-b px-2 py-2.5 text-[var(--text-muted)] opacity-65 last:border-0">
      <div className="min-w-0"><p className="truncate text-sm font-medium">{masjidName(item.masjid, language)}</p><p className="text-xs">{ta ? PRAYER_TA[item.prayer] : PRAYER_EN[item.prayer]} · {ta ? "முடிந்த இகாமத்" : "Completed Iqamah"}</p></div>
      <div className="shrink-0 text-right"><p className="text-sm font-semibold">{record ? formatIqamahValue(record.iqamah, record.adhan, language, timeFormat) : formatTime(item.time, timeFormat)}</p></div>
    </Link>;
  };

  return <main className="mx-auto min-h-screen max-w-[1320px] px-4 pb-8 sm:px-7 lg:px-10">
    <AppHeader />
    {next && <div className="mx-auto w-full max-w-2xl"><NextIqamahHero next={next} timeFormat={timeFormat} travel={heroTravel} mayMiss={heroMayMiss} /></div>}
    <DailyContext />
    <section aria-live="polite" className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-1.5 text-xs leading-5 ${freshness.stale ? "border-[var(--accent-2)] bg-[color-mix(in_srgb,var(--accent-2)_14%,var(--bg-card))]" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
      <p className={`font-medium ${freshness.stale ? "stale-label" : "text-[var(--text)]"}`}>{freshnessText}</p>
      {freshness.stale && <span className="stale-label font-semibold">{copy("stale", language)}</span>}
      {freshness.missingOrInvalid > 0 && <p className="text-[var(--text-muted)]">{copy("observationsIncomplete", language).replace("{n}", String(freshness.missingOrInvalid))}</p>}
      <TimetableDataNotice className="basis-full" />
    </section>
    <div className="mt-2">
      <MasjidList items={directory} timeFormat={timeFormat} sortMode={effectiveSortMode} onNext={() => setSortMode("next")} onDistance={() => requestLocation(true)} onUseLocation={() => requestLocation(false)} location={currentLocation} locationState={locationState} now={now} />
    </div>
    <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" aria-expanded={completedOpen} aria-controls="completed-jamaats" onClick={() => setCompletedOpen((open) => !open)}>
        <span>{`Completed Jamaats · ${completed.length}`}</span><span aria-hidden="true" className="text-xs">{completedOpen ? "−" : "+"}</span>
      </button>
      <div id="completed-jamaats" hidden={!completedOpen} className="max-h-[420px] overflow-y-auto border-t border-[var(--border)] px-3 py-1">{completed.length ? completed.map(entry) : <p className="px-2 py-3 text-sm text-[var(--text-muted)]">{ta ? "இன்னும் Completed Jamaat இல்லை" : "No completed Jamaats yet"}</p>}</div>
    </section>
    <footer className="mt-8 border-t pt-4 text-center text-xs leading-6 text-[var(--text-muted)]">
      {ta ? "Community prayer times · noticeboard தகவல்கள்" : "Community prayer times · Noticeboard sources"}<br />
      {ta ? "உங்கள் அடுத்த Jamaat-ஐ கண்டறியுங்கள்." : "SaffReady — Find your next Jamaat."}
      <p className="mt-1"><a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline decoration-[var(--border)] underline-offset-2">{copy("weatherAttribution", language)}</a></p>
      {QURAN_APP_PROMOTION.enabled && QURAN_APP_PROMOTION.url && <p className="mt-2"><span>{ta ? QURAN_APP_PROMOTION.tamilTitle : QURAN_APP_PROMOTION.englishTitle}</span><br /><a className="underline decoration-[var(--border)] underline-offset-2" href={QURAN_APP_PROMOTION.url}>{ta ? QURAN_APP_PROMOTION.tamilLink : QURAN_APP_PROMOTION.englishLink}</a></p>}
    </footer>
  </main>;
}
