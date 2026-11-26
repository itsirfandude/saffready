import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

const root = process.cwd();

function pngSize(path: string) {
  const buffer = readFileSync(resolve(root, path));
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("SaffReady PWA assets and manifest", () => {
  it("has the required standalone manifest fields and explicit root scope", () => {
    const value = manifest();
    expect(value).toMatchObject({
      name: "SaffReady · Find your next Jamaat.",
      short_name: "SaffReady",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#050505",
      theme_color: "#050505",
      prefer_related_applications: false,
    });
  });

  it("ships separate 192, 512, maskable, and Apple PNG icons referenced by the manifest", () => {
    const value = manifest();
    const expected = [
      ["/icons/icon-192x192.png", "192x192", "any"],
      ["/icons/icon-512x512.png", "512x512", "any"],
      ["/icons/maskable-icon-512x512.png", "512x512", "maskable"],
    ] as const;
    for (const [src, sizes, purpose] of expected) {
      const icon = value.icons?.find((entry) => entry.src === src);
      expect(icon).toMatchObject({ src, sizes, type: "image/png", purpose });
      const pixels = Number.parseInt(sizes, 10);
      expect(pngSize(`public${src}`)).toEqual({ width: pixels, height: pixels });
    }
    expect(pngSize("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("keeps the arch artwork centered inside the Android maskable safe area", () => {
    const svg = readFileSync(resolve(root, "public/icons/saffready-master.svg"), "utf8");
    expect(svg).toContain("#050505");
    expect(svg).toContain("#D4AF37");
    expect(svg).toContain("M139 364V236a117 117 0 0 1 234 0v128");
    expect(svg).toContain("M235 353V321a21 21 0 0 1 42 0v32");
    expect(svg).toContain('<circle cx="256" cy="283" r="9"/>');
    // Artwork bounds stay within the 512px maskable safe circle (r = 40% of canvas).
    const safeRadius = 512 * 0.4;
    for (const [x, y] of [[127, 109], [385, 109], [127, 376], [385, 376], [184, 356], [326, 356]]) {
      expect(Math.hypot(x - 256, y - 256)).toBeLessThan(safeRadius);
    }
  });

  it("uses the same default theme color in metadata and preserves theme switching", () => {
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    expect(layout).toContain('themeColor: "#050505"');
    expect(layout).toContain("colors[theme] || colors.classic");
    expect(layout).toContain('icons: { apple: "/apple-touch-icon.png" }');
  });
});
