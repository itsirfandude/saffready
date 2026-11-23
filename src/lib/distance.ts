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

export function sortByDistance<T extends { masjid: Masjid }>(items: T[], location: UserLocation): (T & { distanceKm: number })[] {
  return items
    .filter((item) => item.masjid.lat !== null && item.masjid.lng !== null)
    .map((item) => ({ ...item, distanceKm: haversineDistanceKm(location, { latitude: item.masjid.lat!, longitude: item.masjid.lng! }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistance(distanceKm: number): string {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
}
