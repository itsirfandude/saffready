import type { Masjid } from "@/src/types/masjid";
import { haversineDistanceKm, type UserLocation } from "@/src/lib/travel";
export { haversineDistanceKm, type UserLocation } from "@/src/lib/travel";

export function sortByDistance<T extends { masjid: Masjid }>(items: T[], location: UserLocation): (T & { distanceKm?: number })[] {
  const located: (T & { distanceKm: number })[] = [];
  const withoutCoordinates: (T & { distanceKm?: number })[] = [];
  for (const item of items) {
    const { lat, lng } = item.masjid;
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      withoutCoordinates.push({ ...item });
      continue;
    }
    located.push({ ...item, distanceKm: haversineDistanceKm(location, { latitude: lat, longitude: lng }) });
  }
  located.sort((a, b) => a.distanceKm - b.distanceKm);
  return [...located, ...withoutCoordinates];
}

export function formatDistance(distanceKm: number): string {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
}
