import {NextResponse} from "next/server";
import {validateMasjids} from "@/src/lib/validation";
export const revalidate=300;
export async function GET(){
  const endpoint=process.env.SHEETS_JSON_URL;
  if(!endpoint)return NextResponse.json({error:"Timetable source is not configured"},{status:503});
  try{const response=await fetch(endpoint,{next:{revalidate:300}});if(!response.ok)throw new Error("Publisher unavailable");const data=await response.json();if(!data||!validateMasjids(data.masjids)||!data.version||!data.publishedAt)throw new Error("Publisher returned an invalid timetable");return NextResponse.json(data,{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=300"}})}catch{return NextResponse.json({error:"Latest timetable unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
