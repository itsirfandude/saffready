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
import { getObservationFreshness, observationFreshnessMessage } from "@/src/lib/observed-freshness";
import { travelForMasjid, isReachable, type TravelEstimate } from "@/src/lib/travel";
import { copy } from "@/src/constants/strings";
import { ongoingKey, selectOngoingHero } from "@/src/lib/hero-selection";
import { COUNTDOWN_REFRESH_MS } from "@/src/lib/countdown";

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
  const [selectedOngoingKey, setSelectedOngoingKey] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    let interval: number | undefined;
    const firstTick = window.setTimeout(() => {
      refresh();
      interval = window.setInterval(refresh, COUNTDOWN_REFRESH_MS);
    }, COUNTDOWN_REFRESH_MS - (Date.now() % COUNTDOWN_REFRESH_MS));
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(firstTick); if (interval !== undefined) clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
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
  const freshnessText = observationFreshnessMessage(freshness.latest, ageDays, language);
  const available = nextItems.filter((item): item is NextIqamah => !("unavailable" in item));
  const reachable = currentLocation ? available.find((item) => {
    const travel = travelForMasjid(currentLocation, item.masjid);
    return travel !== null && isReachable(now, item.at, travel.minutes);
  }) : undefined;
  const next = reachable ?? available[0];
  const relevantOngoing = currentLocation ? [...schedule.ongoing].sort((a, b) => {
    const aTravel = travelForMasjid(currentLocation, a.masjid);
    const bTravel = travelForMasjid(currentLocation, b.masjid);
    return (aTravel?.minutes ?? Number.POSITIVE_INFINITY) - (bTravel?.minutes ?? Number.POSITIVE_INFINITY);
  }) : schedule.ongoing;
  const selectedOngoing = selectOngoingHero(relevantOngoing, selectedOngoingKey);
  useEffect(() => {
    if (!selectedOngoing) { setSelectedOngoingKey(null); return; }
    const key = ongoingKey(selectedOngoing);
    if (key !== selectedOngoingKey) setSelectedOngoingKey(key);
  }, [selectedOngoing, selectedOngoingKey]);
  const heroItem: NextIqamah | undefined = selectedOngoing
    ? { masjid: selectedOngoing.masjid, prayer: selectedOngoing.prayer, time: selectedOngoing.time, at: selectedOngoing.at, minutesRemaining: 0, tomorrow: false }
    : next;
  const heroTravel: TravelEstimate | null = currentLocation && heroItem ? travelForMasjid(currentLocation, heroItem.masjid) : null;
  const heroMayMiss = Boolean(currentLocation && heroTravel && heroItem && !selectedOngoing && !isReachable(now, heroItem.at, heroTravel.minutes));
  const directory = useMemo(() => {
    if (effectiveSortMode !== "distance" || !currentLocation) return nextItems;
    const ongoingByMasjid = new Map(schedule.ongoing.map((item) => [item.masjid.id, item]));
    const distanceItems = nextItems.map((item) => {
      const ongoingItem = ongoingByMasjid.get(item.masjid.id);
      return ongoingItem ? { ...ongoingItem, minutesRemaining: 0, tomorrow: false } : item;
    });
    return sortByDistance(distanceItems, currentLocation);
  }, [currentLocation, effectiveSortMode, nextItems, schedule.ongoing]);

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

  return <main className="mx-auto min-h-screen w-full max-w-[760px] px-4 pb-10 sm:px-6">
    <AppHeader />
    {heroItem && <div className="w-full"><NextIqamahHero next={heroItem} timeFormat={timeFormat} travel={heroTravel} mayMiss={heroMayMiss} ongoing={Boolean(selectedOngoing)} /></div>}
    <DailyContext />
    <section aria-live="polite" className="my-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[11px] leading-5 text-[var(--text-muted)] sm:px-5">
      <p className={freshness.stale ? "stale-label font-semibold" : "text-[var(--text-muted)]"}>{freshnessText}</p>
      {freshness.stale && <span className="stale-label font-semibold">{copy("stale", language)}</span>}
      {freshness.missingOrInvalid > 0 && <p>{copy("observationsIncomplete", language).replace("{n}", String(freshness.missingOrInvalid))}</p>}
      <TimetableDataNotice className="text-[10px] sm:text-[11px]" />
    </section>
    <div className="mt-4">
      <MasjidList items={directory} ongoing={schedule.ongoing} timeFormat={timeFormat} sortMode={effectiveSortMode} onNext={() => setSortMode("next")} onDistance={() => requestLocation(true)} onUseLocation={() => requestLocation(false)} location={currentLocation} locationState={locationState} now={now} />
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
