import type { Masjid } from "@/src/types/masjid";
import { haversineDistanceKm, type UserLocation } from "@/src/lib/distance";

export const STREET_DETOUR_FACTOR = 1.3;
export const WALKING_SPEED_KMH = 5;
export const BICYCLE_SPEED_KMH = 15;
export const WALKING_BIKE_THRESHOLD_MINUTES = 20;
export const REACHABILITY_BUFFER_MINUTES = 1;

export interface TravelEstimate {
  distanceKm: number;
  adjustedDistanceKm: number;
  walkMinutes: number;
  bikeMinutes: number;
  mode: "walk" | "bike";
  minutes: number;
}

function validCoordinate(value: number | null | undefined, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function estimateTravel(distanceKm: number): TravelEstimate {
  const adjustedDistanceKm = Math.max(0, distanceKm) * STREET_DETOUR_FACTOR;
  const walkMinutes = Math.ceil((adjustedDistanceKm / WALKING_SPEED_KMH) * 60);
  const bikeMinutes = Math.ceil((adjustedDistanceKm / BICYCLE_SPEED_KMH) * 60);
  const mode = walkMinutes > WALKING_BIKE_THRESHOLD_MINUTES ? "bike" : "walk";
  return {
    distanceKm,
    adjustedDistanceKm,
    walkMinutes,
    bikeMinutes,
    mode,
    minutes: mode === "walk" ? walkMinutes : bikeMinutes,
  };
}

/** Returns null when the user's location or the Masjid coordinates are invalid or absent. */
export function travelForMasjid(location: UserLocation, masjid: Masjid): TravelEstimate | null {
  if (
    !validCoordinate(location.latitude, -90, 90) ||
    !validCoordinate(location.longitude, -180, 180) ||
    !validCoordinate(masjid.lat, -90, 90) ||
    !validCoordinate(masjid.lng, -180, 180)
  ) return null;
  return estimateTravel(haversineDistanceKm(location, { latitude: masjid.lat, longitude: masjid.lng }));
}

export function isReachable(
  now: Date,
  iqamahAt: Date,
  travelMinutes: number,
  bufferMinutes = REACHABILITY_BUFFER_MINUTES,
): boolean {
  const nowMs = now.getTime();
  const iqamahMs = iqamahAt.getTime();
  if (!Number.isFinite(nowMs) || !Number.isFinite(iqamahMs) || !Number.isFinite(travelMinutes) || travelMinutes < 0) return false;
  return nowMs + (travelMinutes + bufferMinutes) * 60_000 <= iqamahMs;
}
