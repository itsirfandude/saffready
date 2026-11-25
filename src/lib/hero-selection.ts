import type { DailyIqamah } from "@/src/lib/scheduling";

export function ongoingKey(item: Pick<DailyIqamah, "masjid" | "prayer" | "time">): string {
  return `${item.masjid.id}:${item.prayer}:${item.time}`;
}

export function selectOngoingHero(ongoing: DailyIqamah[], previousKey: string | null): DailyIqamah | null {
  return ongoing.find((item) => ongoingKey(item) === previousKey) ?? ongoing[0] ?? null;
}
