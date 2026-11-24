type SyncOptions = {
  endpoint?: string;
  outputPath?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  readFileImpl?: typeof import("node:fs/promises").readFile;
  writeFileImpl?: typeof import("node:fs/promises").writeFile;
  renameImpl?: typeof import("node:fs/promises").rename;
  unlinkImpl?: typeof import("node:fs/promises").unlink;
};

export const DEFAULT_FALLBACK_PATH: string;
export function syncTimetable(options?: SyncOptions): Promise<{ version: string | number; masjidCount: number }>;
