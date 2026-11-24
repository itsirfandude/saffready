import timetableSnapshot from "@/data/masjids.json";
import type { Masjid } from "@/src/types/masjid";
import { additionalMasjids } from "@/src/lib/additional-masjids";

const existingMeta: Record<string, Pick<Masjid, "lat" | "lng" | "affiliation" | "mapsUrl">> = {
  "masjidus-salam": { lat: 10.9805512, lng: 76.9691124, affiliation: "TNTJ", mapsUrl: "https://maps.app.goo.gl/zy4ecehZQHkNagYN8" },
  "masjid-maalikul-mulk": { lat: 10.9819627, lng: 76.9715395, affiliation: "JAQH", mapsUrl: "https://maps.app.goo.gl/UUoAt8bymZvXCXR86" },
  "masjidul-quddus": { lat: 10.9812419, lng: 76.9732471, affiliation: "YMJ", mapsUrl: "https://maps.app.goo.gl/5wsDRYCpypxCj6LY7" },
  "masjidul-mumineen": { lat: 10.9814676, lng: 76.9679835, affiliation: "SUNNAT JAMAAT", mapsUrl: "https://maps.app.goo.gl/6VuPpBrTYkavoe218" },
  "masjid-arafa": { lat: 10.9812245, lng: 76.9743374, affiliation: null, mapsUrl: "https://maps.app.goo.gl/44tZKaJHMPJmRpSU9" },
  "masjidul-akram": { lat: 10.9821941, lng: 76.9678716, affiliation: "NTF", mapsUrl: "https://maps.app.goo.gl/9EUmG8RdZZhn2RnK7" },
};

const snapshot = timetableSnapshot as unknown as { masjids?: Masjid[] } | Masjid[];
const isSyncedSnapshot = !Array.isArray(snapshot) && Array.isArray(snapshot.masjids);
const rawMasjids = (isSyncedSnapshot ? snapshot.masjids : snapshot) as Masjid[];

// Legacy bundled arrays retain their historical metadata overlays. A publisher snapshot
// is already complete and must remain byte-for-field equivalent to the validated feed.
export const masjids: Masjid[] = isSyncedSnapshot
  ? rawMasjids
  : [
      ...rawMasjids.map((masjid) => ({ ...masjid, ...existingMeta[masjid.id] })),
      ...additionalMasjids,
    ].map((masjid) => ({ ...masjid, timingPattern: masjid.timingPattern ?? "unknown", active: true, prayers: masjid.prayers.map(p => p.prayer === "jumuah" ? { ...p, timingPattern: "fixed" as const } : p) }));
export function getMasjid(id: string) { return masjids.find((masjid) => masjid.id === id); }
