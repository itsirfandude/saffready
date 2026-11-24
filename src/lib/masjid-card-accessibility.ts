import { copy, type Language } from "@/src/constants/strings";
import type { TravelEstimate } from "@/src/lib/travel";

export function buildMasjidCardAccessibleLabel(input: {
  name: string;
  prayer: string;
  iqamahTime: string;
  minutesRemaining: number;
  travel: TravelEstimate | null | undefined;
  mayMiss: boolean;
  language: Language;
}): string {
  const { name, prayer, iqamahTime, minutesRemaining, travel, mayMiss, language } = input;
  return [
    name,
    `${copy("nextIqamahLabel", language)}: ${prayer} ${copy("iqamah", language)} ${iqamahTime}`,
    copy("timeRemaining", language).replace("{n}", String(minutesRemaining)),
    travel ? copy(travel.mode === "walk" ? "aboutWalk" : "aboutBike", language).replace("{n}", String(travel.minutes)) : "",
    mayMiss ? copy("mayMiss", language) : "",
  ].filter(Boolean).join(", ");
}
