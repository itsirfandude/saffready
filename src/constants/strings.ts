export type Language = "ta" | "en";

export const STRINGS = {
  oldestObservation: {
    en: "Oldest board observation: {date} ({n} days ago)",
    ta: "பழமையான பலகைப் பதிவு: {date} ({n} நாட்களுக்கு முன்)",
  },
  observationToday: { en: "today", ta: "இன்று" },
  observationsIncomplete: {
    en: "Observation dates are incomplete for {n} masjids.",
    ta: "{n} மஸ்ஜித்களின் பதிவு தேதிகள் முழுமையாக இல்லை.",
  },
  observationUnavailable: {
    en: "Oldest board observation unavailable (observation dates incomplete).",
    ta: "பழமையான பலகைப் பதிவு கிடைக்கவில்லை (பதிவு தேதிகள் முழுமையில்லை).",
  },
  stale: { en: "Stale · over 14 days", ta: "பழைய பதிவு · 14 நாட்களுக்கு மேல்" },
  timetableSourceStale: {
    en: "Showing a stale timetable snapshot · last published {date}",
    ta: "பழைய timetable snapshot காட்டப்படுகிறது · கடைசி வெளியீடு {date}",
  },
  timetableBundled: {
    en: "Showing bundled fallback timetable",
    ta: "சேமிக்கப்பட்ட fallback timetable காட்டப்படுகிறது",
  },
  timetableCached: {
    en: "Showing cached timetable · last published {date}",
    ta: "Cached timetable காட்டப்படுகிறது · கடைசி வெளியீடு {date}",
  },
  timetableCacheExpired: {
    en: "Saved timetable cache expired · showing bundled data",
    ta: "சேமித்த timetable cache காலாவதியானது · bundled data காட்டப்படுகிறது",
  },
  timetableUnavailable: {
    en: "Live timetable unavailable · showing bundled data",
    ta: "Live timetable கிடைக்கவில்லை · bundled data காட்டப்படுகிறது",
  },
  untilIqamah: { en: "Until Iqamah", ta: "இகாமத்துக்கு இன்னும்" },
  observationDatesIncomplete: { en: "Observation date unavailable", ta: "பதிவு தேதி கிடைக்கவில்லை" },
  walk: { en: "~{n} min walk", ta: "நடை ~{n} நிமி" },
  bike: { en: "~{n} min by bike", ta: "பைக் ~{n} நிமி" },
  mayMiss: { en: "May miss", ta: "தாமதமாகும்" },
  locationHint: {
    en: "Allow location to see which masjids you can reach",
    ta: "இருப்பிடத்தை அனுமதித்தால் எந்த மஸ்ஜிதை அடையலாம் எனக் காட்டுவோம்",
  },
  useLocation: { en: "Use my location", ta: "என் இருப்பிடம்" },
  next: { en: "Next", ta: "அடுத்தது" },
  tomorrow: { en: "Tomorrow", ta: "நாளை" },
  locationLoading: { en: "Locating…", ta: "இருப்பிடம் தேடுகிறது…" },
  locationUnavailable: { en: "Location unavailable", ta: "இருப்பிடம் கிடைக்கவில்லை" },
  locationDenied: { en: "Location permission denied", ta: "இருப்பிட அனுமதி மறுக்கப்பட்டது" },
  locationTimedOut: { en: "Location timed out. Try again.", ta: "இருப்பிடத் தேடல் நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்." },
  sunrise: { en: "Sunrise", ta: "சூரிய உதயம்" },
  sunset: { en: "Sunset", ta: "சூரிய அஸ்தமனம்" },
  iqamah: { en: "Iqamah", ta: "இகாமத்" },
  nextIqamahLabel: { en: "Next Iqamah", ta: "அடுத்த இகாமத்" },
  timeRemaining: { en: "in {n} minutes", ta: "இன்னும் {n} நிமிடங்களில்" },
  aboutWalk: { en: "about {n} minute walk", ta: "சுமார் {n} நிமிட நடை" },
  aboutBike: { en: "about {n} minutes by bike", ta: "சுமார் {n} நிமிடம் பைக்கில்" },
  observedOn: { en: "Observed", ta: "பார்த்த தேதி" },
  noticeboardSource: { en: "Noticeboard source", ta: "Noticeboard source" },
  verificationRecent: { en: "Recently verified", ta: "சமீபத்தில் சரிபார்க்கப்பட்டது" },
  verificationDue: { en: "Verification due", ta: "சரிபார்ப்பு தேவை" },
  verificationUnavailable: { en: "Verification unavailable", ta: "சரிபார்ப்பு தேதி கிடைக்கவில்லை" },
  weatherAttribution: { en: "Weather data: Open-Meteo", ta: "Weather data: Open-Meteo" },
} as const;

export function copy(key: keyof typeof STRINGS, language: Language): string {
  return STRINGS[key][language];
}
