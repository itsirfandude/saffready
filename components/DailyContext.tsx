"use client";
import { useEffect, useState } from "react";
import { formatTime } from "@/src/lib/format-time";
import { usePreferences } from "@/components/PreferencesProvider";
import { copy } from "@/src/constants/strings";

type Weather = {
  current?: { temperature_2m: number; weather_code: number };
  daily?: { sunrise: string[]; sunset: string[] };
  fetchedAt?: string;
  error?: string;
};

const labels: Record<number, [string, string]> = {
  0: ["தெளிவான வானம்", "Clear sky"], 1: ["பெரும்பாலும் தெளிவு", "Mainly clear"],
  2: ["பகுதி மேகமூட்டம்", "Partly cloudy"], 3: ["மேகமூட்டம்", "Overcast"],
  45: ["மூடுபனி", "Fog"], 48: ["மூடுபனி", "Fog"], 51: ["தூறல்", "Drizzle"],
  53: ["தூறல்", "Drizzle"], 55: ["தூறல்", "Drizzle"], 61: ["மழை", "Rain"],
  63: ["மழை", "Rain"], 65: ["கனமழை", "Heavy rain"], 80: ["மழை", "Rain showers"],
  81: ["மழை", "Rain showers"], 82: ["கனமழை", "Heavy showers"],
};

function weatherTime(value?: string) {
  const match = value?.match(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function DailyContext() {
  const { language, timeFormat } = usePreferences();
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherStale, setWeatherStale] = useState(false);
  const ta = language === "ta";

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let live = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        if (!response.ok) throw new Error("Weather unavailable");
        const data: Weather = await response.json();
        if (live && !data.error) {
          setWeather(data);
          setWeatherStale(false);
          localStorage.setItem("saffready-weather", JSON.stringify(data));
        }
      } catch {
        if (!live) return;
        setWeatherStale(true);
        try {
          const cached = JSON.parse(localStorage.getItem("saffready-weather") || "null") as Weather | null;
          if (cached) setWeather(cached);
        } catch { /* Weather is optional. */ }
      }
    };
    void refresh();
    const interval = setInterval(refresh, 600_000);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", refresh);
    return () => {
      live = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", refresh);
    };
  }, []);

  const date = new Intl.DateTimeFormat(ta ? "ta-IN" : "en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(now);
  const clock = new Intl.DateTimeFormat(ta ? "ta-IN" : "en-IN", {
    hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h", timeZone: "Asia/Kolkata",
  }).format(now);
  const sunrise = weatherTime(weather?.daily?.sunrise?.[0]);
  const sunset = weatherTime(weather?.daily?.sunset?.[0]);
  const code = weather?.current?.weather_code;
  const condition = code === undefined ? null : (labels[code]?.[ta ? 0 : 1] || (ta ? "வானிலை" : "Weather"));

  return <section aria-label={date} className="my-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-muted)] shadow-[var(--card-shadow)] sm:px-5">
    <span className="font-medium text-[var(--text)]">{date} · {clock}</span>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {sunrise && <span>{copy("sunrise", language)} <b className="text-[var(--text)]">{formatTime(sunrise, timeFormat)}</b></span>}
      {sunset && <span>{copy("sunset", language)} <b className="text-[var(--text)]">{formatTime(sunset, timeFormat)}</b></span>}
      {!weatherStale && weather?.current && <span><b className="text-[var(--text)]">{Math.round(weather.current.temperature_2m)}°C</b>{condition && ` · ${condition}`}</span>}
    </div>
  </section>;
}
