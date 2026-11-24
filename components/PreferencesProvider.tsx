"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { TimeFormat } from "@/src/lib/format-time";
import { masjids as bundledMasjids } from "@/src/lib/data";
import { validateMasjids } from "@/src/lib/validation";
import { readTimetableCache, TIMETABLE_CACHE_KEY } from "@/src/lib/timetable-cache";
import type { Masjid } from "@/src/types/masjid";
import { isDarkTheme, THEME_COLORS, type Theme } from "@/src/lib/theme";

export type { Theme } from "@/src/lib/theme";
type Language = "ta" | "en";
type DataSource = "bundled" | "live" | "cached" | "source-stale" | "expired";
const CLIENT_REFRESH_MS = 60_000;
const Context = createContext<{
  theme: Theme;
  setTheme: (value: Theme) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (value: TimeFormat) => void;
  language: Language;
  setLanguage: (value: Language) => void;
  masjids: Masjid[];
  dataStale: boolean;
  dataSource: DataSource;
  lastDataUpdate: string | null;
}>({
  theme: "classic", setTheme: () => {}, timeFormat: "12h", setTimeFormat: () => {}, language: "ta", setLanguage: () => {},
  masjids: bundledMasjids, dataStale: false, dataSource: "bundled", lastDataUpdate: null,
});

const endpoint = "/api/timetable";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("classic");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
  const [language, setLanguage] = useState<Language>("ta");
  const [masjids, setMasjids] = useState(bundledMasjids);
  const [dataStale, setDataStale] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>("bundled");
  const [lastDataUpdate, setLastDataUpdate] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "classic";
    setTheme((localStorage.getItem("masjid-theme") as Theme) || system);
    setTimeFormat((localStorage.getItem("masjid-time-format") as TimeFormat) || "12h");
    setLanguage(localStorage.getItem("saffready-language") === "en" ? "en" : "ta");
    setPreferencesLoaded(true);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("masjid-theme", theme);
    const color = THEME_COLORS[theme];
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "theme-color"); document.head.appendChild(meta); }
    meta.setAttribute("content", color);
    let status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!status) { status = document.createElement("meta"); status.setAttribute("name", "apple-mobile-web-app-status-bar-style"); document.head.appendChild(status); }
    status.setAttribute("content", isDarkTheme(theme) ? "black-translucent" : "default");
  }, [preferencesLoaded, theme]);

  useEffect(() => { if (preferencesLoaded) localStorage.setItem("masjid-time-format", timeFormat); }, [preferencesLoaded, timeFormat]);
  useEffect(() => {
    if (preferencesLoaded) { localStorage.setItem("saffready-language", language); document.documentElement.lang = language; }
  }, [preferencesLoaded, language]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    let active = true;
    let refreshing = false;
    let controller: AbortController | null = null;

    const useLocalFallback = () => {
      let savedRaw: string | null = null;
      try { savedRaw = localStorage.getItem(TIMETABLE_CACHE_KEY); } catch { /* Storage may be disabled. */ }
      const saved = readTimetableCache(savedRaw);
      setDataStale(true);
      if (saved.state === "valid") {
        setMasjids(saved.value.masjids);
        setLastDataUpdate(saved.value.publishedAt);
        setDataSource("cached");
        return;
      }
      if (saved.state === "expired") {
        try { localStorage.removeItem(TIMETABLE_CACHE_KEY); } catch { /* Storage may be disabled. */ }
      }
      setMasjids(bundledMasjids);
      setLastDataUpdate(null);
      setDataSource(saved.state === "expired" ? "expired" : "bundled");
    };

    const refresh = async () => {
      if (!active || refreshing) return;
      refreshing = true;
      controller = new AbortController();
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Timetable endpoint unavailable");
        const payload = await response.json();
        if (!validateMasjids(payload.masjids) || typeof payload.publishedAt !== "string" || !payload.publishedAt) {
          throw new Error("Timetable response failed validation");
        }
        if (!active) return;
        setMasjids(payload.masjids);
        setLastDataUpdate(payload.publishedAt);
        if (payload.sourceStale === true) {
          setDataStale(true);
          setDataSource("source-stale");
        } else {
          setDataStale(false);
          setDataSource("live");
          try {
            localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify({
              masjids: payload.masjids,
              publishedAt: payload.publishedAt,
              cachedAt: Date.now(),
            }));
          } catch { /* The live response remains usable if storage is disabled. */ }
        }
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        useLocalFallback();
      } finally {
        refreshing = false;
        controller = null;
      }
    };

    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, CLIENT_REFRESH_MS);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", refresh);
    };
  }, [preferencesLoaded]);

  return <Context.Provider value={{ theme, setTheme, timeFormat, setTimeFormat, language, setLanguage, masjids, dataStale, dataSource, lastDataUpdate }}>{children}</Context.Provider>;
}

export const usePreferences = () => useContext(Context);
