"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { FreshnessLabel } from "@/components/FreshnessLabel";
import { TimetableDataNotice } from "@/components/TimetableDataNotice";
import { PrayerTimetable } from "@/components/PrayerTimetable";
import { usePreferences } from "@/components/PreferencesProvider";
import { getNextIqamah } from "@/src/lib/next-iqamah";
import type { Masjid } from "@/src/types/masjid";
import { masjidName } from "@/src/lib/masjid-name";

export function ClientDetail({ masjid: initialMasjid }: { masjid: Masjid }) {
  const { timeFormat, language, masjids } = usePreferences();
  const [now, setNow] = useState(new Date());
  const ta = language === "ta";
  const masjid = masjids.find((item) => item.id === initialMasjid.id) || initialMasjid;
  const next = getNextIqamah(masjid, now);
  const directions = masjid.lat !== null && masjid.lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${masjid.lat},${masjid.lng}`
    : (masjid.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(masjid.name_en + ", Coimbatore")}`);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP;
  const report = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`${masjid.name_en} timing changed`)}` : null;
  const observed = masjid.observedOn || masjid.prayers.find((prayer) => prayer.observedOn)?.observedOn || null;
  const otherNotes = [
    masjid.source && masjid.source !== "noticeboard_photo" ? masjid.source : null,
    masjid.notes,
    masjid.updatedAt ? `Updated: ${new Intl.DateTimeFormat(ta ? "ta-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(masjid.updatedAt))}` : null,
  ].filter(Boolean);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return <main className="mx-auto min-h-screen max-w-[1320px] px-4 pb-8 sm:px-7 lg:px-10">
    <AppHeader />
    <Link href="/" className="mb-3 inline-flex min-h-11 items-center text-sm text-[var(--accent)]">← Home</Link>
    <TimetableDataNotice className="mb-3 text-xs" />
    <div className="grid gap-5 lg:grid-cols-[minmax(300px,.78fr)_minmax(0,1.22fr)] lg:items-start">
      <section className="ink-card min-w-0 rounded-2xl p-5 sm:p-6 lg:sticky lg:top-4">
        <h1 className={`whitespace-normal break-words font-semibold ${ta ? "font-tamil-text text-2xl" : "text-2xl"}`}>{masjidName(masjid, language)}</h1>
        {masjid.name_ta && <p className="mt-1 whitespace-normal break-words text-sm text-[var(--text-muted)]">{ta ? masjid.name_en : masjid.name_ta}</p>}
        {masjid.affiliation && <p className="mt-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">{masjid.affiliation}</p>}
        <p className="mt-4 text-sm text-[var(--text-muted)]">{masjid.address_ta || (ta ? "Address கிடைக்கவில்லை" : "Address not available")}</p>
        <div className="mt-4 flex flex-wrap gap-2"><a href={directions} target="_blank" rel="noreferrer" className="min-h-11 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)]">Directions</a>{report ? <a href={report} target="_blank" rel="noreferrer" className="ink-card min-h-11 rounded-lg px-4 py-3 text-sm">Report a change</a> : <span className="ink-card rounded-lg px-4 py-3 text-xs text-[var(--text-muted)]">Reporting unavailable</span>}</div>
        <div className="mt-4 border-t pt-3"><FreshnessLabel date={observed} /></div>
      </section>
      <section className="min-w-0">
        <h2 className="mb-2 text-lg font-semibold">Prayer timetable</h2>
        <PrayerTimetable masjid={masjid} timeFormat={timeFormat} nextPrayer={"unavailable" in next ? null : next.prayer} nextTomorrow={"unavailable" in next ? false : next.tomorrow} />
        {otherNotes.length > 0 && <p className="mt-4 text-xs leading-6 text-[var(--text-muted)]">{otherNotes.join(" · ")}</p>}
      </section>
    </div>
  </main>;
}
