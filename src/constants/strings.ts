export type Language = "ta" | "en";

export const STRINGS = {
  oldestObservation: {
    en: "Oldest board observation: {date} ({n} days ago)",
    ta: "பழமையான பலகைப் பதிவு: {date} ({n} நாட்களுக்கு முன்)",
  },
  oldestObservationCompact: { en: "Boards observed {date} · {age}", ta: "பலகைகள் பார்த்தது {date} · {age}" },
  observationToday: { en: "today", ta: "இன்று" },
  observationsIncomplete: {
    en: "Observation dates are incomplete for {n} masjids.",
    ta: "{n} மஸ்ஜித்களின் பதிவு தேதிகள் முழுமையாக இல்லை.",
  },
  observationUnavailable: {
    en: "Board observation date unavailable (observation dates incomplete).",
    ta: "பலகை பார்த்த தேதி கிடைக்கவில்லை (பதிவு தேதிகள் முழுமையில்லை).",
  },
  stale: { en: "Stale · over 14 days", ta: "பழைய பதிவு · 14 நாட்களுக்கு மேல்" },
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
  fixedTimingsDisclaimer: {
    en: "★ Longstanding Salah timings confirmed by the Masjid. Timings may change.",
    ta: "★ மஸ்ஜித் உறுதிப்படுத்திய நீண்டகால தொழுகை நேரங்கள். நேரங்கள் மாறக்கூடும்.",
  },
  fixedTimingIndicator: { en: "Masjid-confirmed longstanding timing", ta: "மஸ்ஜித் உறுதிப்படுத்திய நீண்டகால நேரம்" },
  observationDatesIncomplete: { en: "Observation date unavailable", ta: "பதிவு தேதி கிடைக்கவில்லை" },
  walk: { en: "~{n} min walk", ta: "நடை ~{n} நிமி" },
  bike: { en: "~{n} min by bike", ta: "பைக் ~{n} நிமி" },
  mayMiss: { en: "May miss", ta: "தாமதமாகும்" },
  locationHint: {
    en: "Location is optional. Use your location to show distance and walking time to nearby masjids.",
    ta: "இருப்பிடம் விருப்பத்தேர்வு. அருகிலுள்ள மஸ்ஜித்களின் தூரத்தையும் நடை நேரத்தையும் காண உங்கள் இருப்பிடத்தைப் பயன்படுத்தவும்.",
  },
  useLocation: { en: "Use my location", ta: "என் இருப்பிடத்தைப் பயன்படுத்து" },
  retryLocation: { en: "Try location again", ta: "இருப்பிடத்தை மீண்டும் முயற்சிக்கவும்" },
  next: { en: "Next", ta: "அடுத்தது" },
  tomorrow: { en: "Tomorrow", ta: "நாளை" },
  locationLoading: { en: "Locating…", ta: "இருப்பிடம் தேடுகிறது…" },
  locationUnavailable: { en: "Location could not be found. Prayer times remain available; you can try again.", ta: "இருப்பிடத்தைக் கண்டறிய முடியவில்லை. தொழுகை நேரங்கள் தொடர்ந்து கிடைக்கும்; மீண்டும் முயற்சிக்கலாம்." },
  locationDenied: { en: "Location access is blocked. Allow it in your browser’s site settings, then try again. Prayer times remain available.", ta: "இருப்பிட அனுமதி தடுக்கப்பட்டுள்ளது. உலாவியின் தள அமைப்புகளில் அனுமதித்து மீண்டும் முயற்சிக்கவும். தொழுகை நேரங்கள் தொடர்ந்து கிடைக்கும்." },
  locationTimedOut: { en: "Location lookup timed out. Try again when your signal is stronger; prayer times remain available.", ta: "இருப்பிடத் தேடலுக்கு நேரம் முடிந்தது. சிக்னல் கிடைக்கும் போது மீண்டும் முயற்சிக்கவும்; தொழுகை நேரங்கள் தொடர்ந்து கிடைக்கும்." },
  locationUnsupported: { en: "This browser cannot provide your location. Prayer times remain available.", ta: "இந்த உலாவியில் இருப்பிட வசதி இல்லை. தொழுகை நேரங்கள் தொடர்ந்து கிடைக்கும்." },
  travelUnavailable: { en: "Distance and walking time are not available for this masjid.", ta: "இந்த மஸ்ஜிதிற்கான தூரமும் நடை நேரமும் கிடைக்கவில்லை." },
  sunrise: { en: "Sunrise", ta: "சூரிய உதயம்" },
  sunset: { en: "Sunset", ta: "சூரிய அஸ்தமனம்" },
  iqamah: { en: "Iqamah", ta: "இகாமத்" },
  nextIqamahLabel: { en: "Next Iqamah", ta: "அடுத்த இகாமத்" },
  ongoing: { en: "Ongoing", ta: "நடைபெறுகிறது" },
  endingSoon: { en: "Ending soon", ta: "முடிவடைய உள்ளது" },
  ongoingContext: { en: "Salah ongoing", ta: "தொழுகை நடைபெறுகிறது" },
  endingSoonContext: { en: "Salah ending soon", ta: "தொழுகை முடிவடைய உள்ளது" },
  salahStatus: { en: "Salah status", ta: "தொழுகை நிலை" },
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
