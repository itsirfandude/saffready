import type { Masjid } from "@/src/types/masjid";

export interface UserLocation { latitude: number; longitude: number }

export function haversineDistanceKm(from: UserLocation, to: UserLocation): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
