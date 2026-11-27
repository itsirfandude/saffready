import nextEnv from "@next/env";
import { DEFAULT_REQUEST_TIMEOUT_MS, syncTimetable } from "./sync-timetable.mjs";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.SHEETS_JSON_URL) {
  console.info("Skipping timetable snapshot sync: SHEETS_JSON_URL is not configured.");
} else {
  try {
    const timeoutMs = process.env.SHEETS_SYNC_TIMEOUT_MS
      ? Number(process.env.SHEETS_SYNC_TIMEOUT_MS)
      : DEFAULT_REQUEST_TIMEOUT_MS;
    const result = await syncTimetable({ timeoutMs });
    console.info(`Generated timetable fallback from publisher version ${result.version} (${result.masjidCount} masjids).`);
  } catch (error) {
    // The sync is atomic and rejects stale/invalid input, so the previous last-good
    // bundled snapshot remains available as the build-time offline fallback.
    console.warn("Timetable snapshot sync failed; keeping the existing fallback.");
  }
}
