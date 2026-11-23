import { NextResponse } from "next/server";

export const revalidate = 300;
export async function GET() {
  const latitude=process.env.COIMBATORE_LATITUDE || "10.9940";
  const longitude=process.env.COIMBATORE_LONGITUDE || "76.9660";
  const url=new URL("https://api.open-meteo.com/v1/forecast");
  url.search=new URLSearchParams({latitude,longitude,daily:"sunrise,sunset,daylight_duration",current:"temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",timezone:"Asia/Kolkata"}).toString();
  try { const upstream=await fetch(url,{next:{revalidate:300}}); if(!upstream.ok)throw new Error("Weather source unavailable");const payload=await upstream.json();return NextResponse.json({...payload,source:"Open-Meteo",fetchedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}}); }
  catch { return NextResponse.json({error:"Weather unavailable"},{status:503}); }
}
