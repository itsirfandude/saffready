import { daysSince } from "@/src/lib/freshness";
import { usePreferences } from "@/components/PreferencesProvider";
import { copy } from "@/src/constants/strings";

export function FreshnessLabel({ date }: { date: string | null }) {
  const { language } = usePreferences();
  const parsed = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  const valid = Boolean(date && parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date);
  if (!valid || !date) return <p className="text-xs leading-6 text-[var(--text-muted)]">{copy("verificationUnavailable", language)}</p>;
  const ageDays = daysSince(date);
  if (ageDays === null) return <p className="text-xs leading-6 text-[var(--text-muted)]">{copy("verificationUnavailable", language)}</p>;

  const observed = new Date(`${date}T00:00:00+05:30`);
  const due = ageDays > 14;
  const display = new Intl.DateTimeFormat(language === "ta" ? "ta-IN" : "en-GB", {
    day: "numeric", month: language === "ta" ? "long" : "short", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(observed);
  return (
    <p className="text-xs leading-6 text-[var(--text-muted)]" aria-live="polite">
      {copy("observedOn", language)}: {display} · {copy("noticeboardSource", language)} · {copy(due ? "verificationDue" : "verificationRecent", language)}
    </p>
  );
}
