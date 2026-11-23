import { describe, expect, it } from "vitest";
import { formatTime } from "@/src/lib/format-time";
describe("formatTime",()=>{it("formats 12 hour without leading zero",()=>expect(formatTime("05:25")).toBe("5:25 AM"));it("formats noon and midnight",()=>{expect(formatTime("12:30")).toBe("12:30 PM");expect(formatTime("00:05")).toBe("12:05 AM")});it("formats 24 hour and invalid values",()=>{expect(formatTime("15:45","24h")).toBe("15:45");expect(formatTime(null)).toContain("Not available")})});
