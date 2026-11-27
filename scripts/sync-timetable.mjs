import { readFile, rename, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { validateMasjids } from "../src/lib/validation.ts";

export const DEFAULT_FALLBACK_PATH = resolve("data/masjids.json");
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const MAX_REQUEST_TIMEOUT_MS = 120_000;

function numericVersion(value) {
  if ((typeof value !== "string" && typeof value !== "number") || !/^\d+$/.test(String(value))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function syncTimetable({
  endpoint = process.env.SHEETS_JSON_URL,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  outputPath = DEFAULT_FALLBACK_PATH,
  fetchImpl = fetch,
  now = Date.now,
  readFileImpl = readFile,
  writeFileImpl = writeFile,
  renameImpl = rename,
  unlinkImpl = unlink,
} = {}) {
  if (!endpoint) throw new Error("SHEETS_JSON_URL is required");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_REQUEST_TIMEOUT_MS) {
    throw new Error(`SHEETS_SYNC_TIMEOUT_MS must be an integer from 1 to ${MAX_REQUEST_TIMEOUT_MS}`);
  }
  const response = await fetchImpl(endpoint, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`Publisher request failed (${response.status})`);

  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("Publisher returned invalid JSON"); }

  if (!payload || typeof payload !== "object" || Array.isArray(payload) || payload.sourceStale === true ||
      !numericVersion(payload.version) || typeof payload.publishedAt !== "string" || !payload.publishedAt ||
      !validateMasjids(payload.masjids)) {
    throw new Error("Publisher returned an invalid or stale timetable");
  }

  let current = null;
  try {
    current = JSON.parse(await readFileImpl(outputPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const incomingVersion = numericVersion(payload.version);
  const currentVersion = numericVersion(current?.version);
  if (currentVersion !== null && incomingVersion < currentVersion) {
    throw new Error(`Publisher version ${incomingVersion} is older than local version ${currentVersion}`);
  }
  if (currentVersion !== null && incomingVersion === currentVersion &&
      Date.parse(payload.publishedAt) < Date.parse(current.publishedAt)) {
    throw new Error("Publisher timestamp is older than the local snapshot");
  }

  const temporaryPath = `${outputPath}.${process.pid}.${now()}.tmp`;
  try {
    await writeFileImpl(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { flag: "wx" });
    await renameImpl(temporaryPath, outputPath);
  } catch (error) {
    // A failed write or rename leaves the previous fallback untouched.
    await unlinkImpl(temporaryPath).catch(() => {});
    throw error;
  }
  return { version: payload.version, masjidCount: payload.masjids.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    loadEnvConfig(process.cwd());
    const result = await syncTimetable();
    console.log(`Synced publisher version ${result.version} (${result.masjidCount} masjids) to ${DEFAULT_FALLBACK_PATH}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
