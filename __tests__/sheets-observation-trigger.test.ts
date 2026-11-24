import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { validateMasjids } from "@/src/lib/validation";

function parseCsv(path: string): string[][] {
  const input = readFileSync(path, "utf8").replace(/^\uFEFF/, "").trim();
  return input.split(/\r?\n/).map((line) => {
    const fields: string[] = [];
    let field = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"' && quoted) { field += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { fields.push(field); field = ""; }
      else field += char;
    }
    fields.push(field);
    return fields;
  });
}

class MockSheet {
  constructor(readonly name: string, readonly data: string[][]) {}
  getName() { return this.name; }
  getParent() { return spreadsheet; }
  getDataRange() { return { getDisplayValues: () => this.data.map((row) => [...row]) }; }
  getRange(row: number, col: number, rows = 1, cols = 1) {
    return {
      getDisplayValues: () => this.data.slice(row - 1, row - 1 + rows).map((line) => line.slice(col - 1, col - 1 + cols)),
      getDisplayValue: () => this.data[row - 1]?.[col - 1] ?? "",
      setNumberFormat: () => this,
      setValue: (value: unknown) => { this.data[row - 1][col - 1] = String(value); return this; },
    };
  }
  appendRow(row: unknown[]) { this.data.push(row.map(String)); }
}

const masjidData = parseCsv("google-sheets/Masjids.csv");
const timingData = parseCsv("google-sheets/Prayer_Timings.csv");
const historyData = [parseCsv("google-sheets/Timing_History.csv")[0]];
const settingsData = parseCsv("google-sheets/Settings.csv");
const sheets = new Map<string, MockSheet>();
let spreadsheet: { getSheetByName: (name: string) => MockSheet };

function resetSheets() {
  sheets.clear();
  sheets.set("Masjids", new MockSheet("Masjids", masjidData.map((r) => [...r])));
  sheets.set("Prayer Timings", new MockSheet("Prayer Timings", timingData.map((r) => [...r])));
  sheets.set("Timing History", new MockSheet("Timing History", historyData.map((r) => [...r])));
  sheets.set("Settings", new MockSheet("Settings", settingsData.map((r) => [...r])));
  spreadsheet = { getSheetByName: (name) => sheets.get(name)! };
}

function loadScript() {
  resetSheets();
  const properties = new Map<string, string>([["SPREADSHEET_ID", "test-sheet"], ["VERIFICATION_ADMIN_EMAIL", "owner@example.test"]]);
  const context: Record<string, any> = {
    SpreadsheetApp: { openById: () => spreadsheet },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => properties.get(key) ?? null, setProperty: (key: string, value: string) => properties.set(key, value) }) },
    LockService: { getDocumentLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Session: { getActiveUser: () => ({ getEmail: () => "owner@example.test" }) },
    Utilities: { formatDate: (date: Date, zone: string, pattern: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("/", "-") },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (text: string) => ({ text, setMimeType() { return this; } }) },
    console,
  };
  runInNewContext(readFileSync("google-sheets/Code.gs", "utf8"), context);
  return { context, properties };
}

function editEvent(sheet: MockSheet, row: number, col: number, oldValue?: string) {
  return { range: { getSheet: () => sheet, getRow: () => row, getColumn: () => col, getNumRows: () => 1, getNumColumns: () => 1 }, oldValue, value: sheet.data[row - 1][col - 1] };
}

describe("Apps Script observation updates", () => {
  it("updates only the edited Masjid after a Fajr time edit and publishes its date", () => {
    const { context } = loadScript();
    const timings = sheets.get("Prayer Timings")!, masjids = sheets.get("Masjids")!;
    const row = timingData.findIndex((r) => r[0] === "masjidus-salam") + 1;
    timings.data[row - 1][1] = "05:06";
    context.recordTimingHistory(editEvent(timings, row, 2, "05:05"));
    expect(timings.data[row-1][27]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(timings.data[row-1][28]).toBe("owner@example.test");
    const observedIndex = 10;
    const updated = masjids.data.find((r) => r[0] === "masjidus-salam")![observedIndex];
    const otherRows = masjids.data.slice(1).filter((r) => r[0] !== "masjidus-salam");
    expect(updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(otherRows.map((r) => r[observedIndex])).toEqual(masjidData.slice(1).filter((r) => r[0] !== "masjidus-salam").map((r) => r[observedIndex]));
    const response = JSON.parse(context.doGet().text);
    expect(validateMasjids(response.masjids)).toBe(true);
    expect(response.masjids.find((m: any) => m.id === "masjidus-salam").observedOn).toBe(updated);
    expect(response.masjids).toHaveLength(13);
    expect(response.masjids[0].prayers).toHaveLength(6);
    expect(JSON.stringify(response)).not.toContain("Timing History");
  });

  it("publishes 15 active Masjids without a hard-coded row-count rejection", () => {
    const { context } = loadScript();
    const masjids=sheets.get("Masjids")!, timings=sheets.get("Prayer Timings")!;
    for(const id of ["masjidur-rahman","masjidul-fassam"]) {
      const m=[...masjidData[1]], t=[...timingData[1]];
      m[0]=id; t[0]=id;
      masjids.appendRow(m); timings.appendRow(t);
    }
    const response=JSON.parse(context.doGet().text);
    expect(response.masjids).toHaveLength(15);
    expect(response.masjids.every((m:any)=>m.prayers.length===6)).toBe(true);
    expect(validateMasjids(response.masjids)).toBe(true);
  });

  it("refreshes observation on a Tamil name edit", () => {
    const { context } = loadScript();
    const masjids = sheets.get("Masjids")!, row = masjidData.findIndex((r) => r[0] === "masjid-arafa") + 1;
    masjids.data[row - 1][2] = "மஸ்ஜித் அரஃபா புதிய பெயர்";
    context.recordTimingHistory(editEvent(masjids, row, 3, "மஸ்ஜித் அரஃபா"));
    expect(masjids.data[row - 1][10]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(masjids.data.find((r) => r[0] === "masjidus-salam")![10]).toBe(masjidData[1][10]);
  });

  it("does not change observation dates for administrative edits or observed_on writes", () => {
    const { context } = loadScript();
    const masjids = sheets.get("Masjids")!, row = masjidData.findIndex((r) => r[0] === "masjid-arafa") + 1;
    const original = masjids.data[row - 1][10];
    masjids.data[row - 1][5] = "Edited address";
    context.recordTimingHistory(editEvent(masjids, row, 6, "Old address"));
    expect(masjids.data[row - 1][10]).toBe(original);
    masjids.data[row - 1][10] = "2026-11-24";
    context.recordTimingHistory(editEvent(masjids, row, 11, original));
    expect(masjids.data[row - 1][10]).toBe("2026-11-24");
  });

  it("keeps the existing append-only history entry for the timing edit", () => {
    const { context } = loadScript();
    const timings = sheets.get("Prayer Timings")!, row = timingData.findIndex((r) => r[0] === "masjidus-salam") + 1;
    timings.data[row - 1][1] = "05:06";
    context.recordTimingHistory(editEvent(timings, row, 2, "05:05"));
    expect(sheets.get("Timing History")!.data.at(-2)?.slice(0, 5)).toEqual(["masjidus-salam", "fajr", "fajr_adhan", "05:05", "05:06"]);
    expect(sheets.get("Timing History")!.data.at(-1)?.slice(0, 5)).toEqual(["masjidus-salam", "", "verification", "", "changed"]);
    expect(sheets.get("Timing History")!.data.filter((r)=>r[2]==="verification" && r[0]==="masjidus-salam")).toHaveLength(1);
  });

  it("ignores a single-cell re-entry of the same value", () => {
    const { context } = loadScript();
    const timings=sheets.get("Prayer Timings")!, masjids=sheets.get("Masjids")!, history=sheets.get("Timing History")!;
    const row=timingData.findIndex((r)=>r[0]==="masjidus-salam")+1;
    const updatedAt=timings.data[row-1][27], observedOn=masjids.data[row-1][10], historyLength=history.data.length;
    context.recordTimingHistory(editEvent(timings,row,2,"05:05"));
    expect(timings.data[row-1][27]).toBe(updatedAt);
    expect(masjids.data[row-1][10]).toBe(observedOn);
    expect(history.data).toHaveLength(historyLength);
  });

  it("does not claim correction for a multi-cell edit without a before-edit snapshot", () => {
    const { context } = loadScript();
    const timings=sheets.get("Prayer Timings")!, masjids=sheets.get("Masjids")!, history=sheets.get("Timing History")!;
    const row=timingData.findIndex((r)=>r[0]==="masjidus-salam")+1;
    const updatedAt=timings.data[row-1][27], observedOn=masjids.data[row-1][10], historyLength=history.data.length;
    timings.data[row-1][1]="05:06"; timings.data[row-1][2]="05:26";
    const range={getSheet:()=>timings,getRow:()=>row,getColumn:()=>2,getNumRows:()=>1,getNumColumns:()=>2};
    context.recordTimingHistory({range});
    expect(timings.data[row-1][27]).toBe(updatedAt);
    expect(masjids.data[row-1][10]).toBe(observedOn);
    expect(history.data).toHaveLength(historyLength);
  });

  it("records unchanged verification in Asia/Kolkata date format without changing updated_at", () => {
    const { context } = loadScript();
    const timings=sheets.get("Prayer Timings")!, masjids=sheets.get("Masjids")!;
    const row=timingData.findIndex((r)=>r[0]==="masjidus-salam")+1;
    const priorUpdated=timings.data[row-1][27];
    const priorHistory=sheets.get("Timing History")!.data.map((r)=>[...r]);
    const date=context.verifyMasjidUnchanged("masjidus-salam");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(masjids.data[row-1][10]).toBe(date);
    expect(timings.data[row-1][27]).toBe(priorUpdated);
    expect(sheets.get("Timing History")!.data.slice(0,priorHistory.length)).toEqual(priorHistory);
    expect(sheets.get("Timing History")!.data.at(-1)?.slice(0,5)).toEqual(["masjidus-salam","","verification",masjidData.find((r)=>r[0]==="masjidus-salam")![10],"unchanged"]);
  });

  it("isolates verification to the requested masjid and rejects unauthorized callers", () => {
    const { context } = loadScript();
    const masjids=sheets.get("Masjids")!;
    const before=masjids.data.map((r)=>r[10]);
    context.verifyMasjidUnchanged("masjidus-salam");
    const target=masjidData.findIndex((r)=>r[0]==="masjidus-salam");
    for(let row=1;row<masjids.data.length;row++) if(row!==target) expect(masjids.data[row][10]).toBe(before[row]);
    context.Session.getActiveUser=()=>({getEmail:()=>"stranger@example.test"});
    expect(()=>context.verifyMasjidUnchanged("masjid-arafa")).toThrow(/restricted/);
    context.Session.getActiveUser=()=>({getEmail:()=>""});
    expect(()=>context.verifyMasjidUnchanged("masjid-arafa")).toThrow(/restricted/);
  });

  it("rejects missing or duplicate Masjid IDs before changing data or history", () => {
    const { context } = loadScript();
    const masjids=sheets.get("Masjids")!, history=sheets.get("Timing History")!;
    const rowsBefore=masjids.data.map((r)=>[...r]), historyBefore=history.data.map((r)=>[...r]);
    expect(()=>context.verifyMasjidUnchanged("missing-masjid")).toThrow(/Unknown masjid id/);
    expect(masjids.data).toEqual(rowsBefore);
    expect(history.data).toEqual(historyBefore);
    masjids.data.push([...masjidData[1]]);
    const duplicateRows=masjids.data.map((r)=>[...r]), duplicateHistory=history.data.map((r)=>[...r]);
    expect(()=>context.verifyMasjidUnchanged("masjidus-salam")).toThrow(/Duplicate masjid id/);
    expect(masjids.data).toEqual(duplicateRows);
    expect(history.data).toEqual(duplicateHistory);
  });
});
