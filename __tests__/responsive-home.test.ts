import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("home layout constraints", () => {
  it("keeps the hero and full-width cards in one centered responsive column", () => {
    const home = readFileSync("components/ClientHome.tsx", "utf8");
    const list = readFileSync("components/MasjidList.tsx", "utf8");
    const styles = readFileSync("app/globals.css", "utf8");
    expect(home).toContain("w-full max-w-[760px] px-4");
    expect(home).toContain("{heroItem && <div className=\"w-full\">");
    expect(home).toContain("<MasjidList items={directory}");
    expect(list.match(/grid-cols-2/g)).toBeNull();
    expect((list.match(/jamaat-grid grid grid-cols-1 gap-3/g) ?? []).length).toBe(4);
    expect(styles).toContain("overflow-wrap:anywhere");
  });
});
