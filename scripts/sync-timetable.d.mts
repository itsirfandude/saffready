type SyncOptions = {
  endpoint?: string;
  timeoutMs?: number;
  outputPath?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  readFileImpl?: typeof import("node:fs/promises").readFile;
  writeFileImpl?: typeof import("node:fs/promises").writeFile;
  renameImpl?: typeof import("node:fs/promises").rename;
  unlinkImpl?: typeof import("node:fs/promises").unlink;
};

export const DEFAULT_FALLBACK_PATH: string;
export const DEFAULT_REQUEST_TIMEOUT_MS: number;
export function syncTimetable(options?: SyncOptions): Promise<{ version: string | number; masjidCount: number }>;
