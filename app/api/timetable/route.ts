import { NextResponse } from "next/server";
import { getLiveTimetable } from "@/src/lib/server-timetable";

export async function GET() {
  try {
    return NextResponse.json(await getLiveTimetable(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Latest timetable unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
