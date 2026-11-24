"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {AppHeader} from "@/components/AppHeader";
import {DailyContext} from "@/components/DailyContext";
import {MasjidList} from "@/components/MasjidList";
import {NextIqamahHero} from "@/components/NextIqamahHero";
import {usePreferences} from "@/components/PreferencesProvider";
import {getAllNextIqamah,type NextIqamah} from "@/src/lib/next-iqamah";
import {getDailyIqamahs} from "@/src/lib/scheduling";
import {masjidName} from "@/src/lib/masjid-name";
import {sortByDistance,type UserLocation} from "@/src/lib/distance";
import {formatTime} from "@/src/lib/format-time";
import {formatIqamahValue} from "@/src/lib/format-iqamah";
import {PRAYER_TA,PRAYER_EN} from "@/src/constants/prayers";
import {QURAN_APP_PROMOTION} from "@/src/constants/app";

type SortMode="next"|"distance";
export function ClientHome(){
 const {timeFormat,language,masjids,dataStale,dataSource,lastDataUpdate}=usePreferences();
 const ta=language==="ta";
 const [now,setNow]=useState(new Date());
 const [sortMode,setSortMode]=useState<SortMode>("next");
 const [location,setLocation]=useState<UserLocation|null>(null);
 const [locationState,setLocationState]=useState<"idle"|"loading"|"ready"|"error"|"permission-denied">("idle");
 const [completedOpen,setCompletedOpen]=useState(false);
 useEffect(()=>{const refresh=()=>setNow(new Date());const id=setInterval(refresh,30000);document.addEventListener("visibilitychange",refresh);return()=>{clearInterval(id);document.removeEventListener("visibilitychange",refresh)}},[]);
 const activeMasjids=masjids.filter(m=>m.active!==false);
 const nextItems=useMemo(()=>getAllNextIqamah(activeMasjids,now),[activeMasjids,now]);
 const next=nextItems.find((item):item is NextIqamah=>!("unavailable" in item));
 const directory=useMemo(()=>sortMode==="distance"&&location?sortByDistance(nextItems,location):nextItems,[location,nextItems,sortMode]);
 const schedule=useMemo(()=>getDailyIqamahs(activeMasjids,now),[activeMasjids,now]);
 const completed=schedule.completed;
 const chooseDistance=()=>{setSortMode("distance");if(location||locationState==="loading")return;if(!navigator.geolocation){setLocationState("error");setSortMode("next");return}setLocationState("loading");navigator.geolocation.getCurrentPosition(pos=>{setLocation({latitude:pos.coords.latitude,longitude:pos.coords.longitude});setLocationState("ready")},error=>{setLocationState(error.code===1?"permission-denied":"error");setSortMode("next")},{enableHighAccuracy:false,timeout:10000,maximumAge:300000})};
 const entry=(item:typeof completed[number])=>{const record=item.masjid.prayers.find(p=>p.prayer===item.prayer);return <Link href={`/masjid/${item.masjid.id}`} key={`${item.masjid.id}-${item.prayer}-${item.time}`} className="flex items-center justify-between gap-3 border-b px-2 py-2.5 text-[var(--text-muted)] opacity-65 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{masjidName(item.masjid,language)}</p><p className="text-xs text-[var(--text-muted)]">{ta?PRAYER_TA[item.prayer]:PRAYER_EN[item.prayer]} · Completed</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold">{record?formatIqamahValue(record.iqamah,record.adhan,language,timeFormat):formatTime(item.time,timeFormat)}</p></div></Link>};
 return <main className="mx-auto min-h-screen max-w-[1320px] px-4 pb-8 sm:px-7 lg:px-10">
  <AppHeader/><div className="gold-rule mb-2"/>
  <DailyContext/>
  <section className="ink-card mt-4 rounded-xl px-4 py-3 text-xs text-[var(--text-muted)]"><span>{ta?"Timetable status":"Timetable source"}</span>{dataStale?<span className="stale-label font-semibold">{ta?(dataSource==="bundled"?" · Service கிடைக்கவில்லை — app data காட்டப்படுகிறது":" · Service கிடைக்கவில்லை — சமீபத்திய data காட்டப்படுகிறது"):(dataSource==="bundled"?" · Timetable source unavailable — showing bundled data":" · Timetable source unavailable — showing last successful data")}</span>:<span>{ta?" · Latest data":" · Current dataset"}</span>}{lastDataUpdate&&<span>{` · ${new Intl.DateTimeFormat(ta?"ta-IN":"en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(lastDataUpdate))}`}</span>}</section>
  <div className="grid gap-5 lg:grid-cols-[minmax(300px,.83fr)_minmax(0,1.17fr)] lg:items-start">
   <div className="min-w-0">{next&&<NextIqamahHero next={next} timeFormat={timeFormat}/>}</div>
   <MasjidList items={directory} timeFormat={timeFormat} sortMode={sortMode} onNext={()=>setSortMode("next")} onDistance={chooseDistance} locationState={locationState}/>
  </div>
  <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
   <button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" aria-expanded={completedOpen} aria-controls="completed-jamaats" onClick={()=>setCompletedOpen(open=>!open)}>
    <span>{`Completed Jamaats · ${completed.length}`}</span><span aria-hidden="true" className="text-xs">{completedOpen?"−":"+"}</span>
   </button>
   <div id="completed-jamaats" hidden={!completedOpen} className="max-h-[420px] overflow-y-auto border-t border-[var(--border)] px-3 py-1">{completed.length?completed.map(entry):<p className="px-2 py-3 text-sm text-[var(--text-muted)]">{ta?"இன்னும் Completed Jamaat இல்லை":"No completed Jamaats yet"}</p>}</div>
  </section>
  <footer className="mt-8 border-t pt-4 text-center text-xs leading-6 text-[var(--text-muted)]">{ta?"Community prayer times · noticeboard தகவல்கள்":"Community prayer times · Noticeboard sources"}<br/>{ta?"உங்கள் அடுத்த Jamaat-ஐ கண்டறியுங்கள்.":"SaffReady — Find your next Jamaat."}{QURAN_APP_PROMOTION.enabled&&QURAN_APP_PROMOTION.url&&<p className="mt-2"><span>{ta?QURAN_APP_PROMOTION.tamilTitle:QURAN_APP_PROMOTION.englishTitle}</span><br/><a className="underline decoration-[var(--border)] underline-offset-2" href={QURAN_APP_PROMOTION.url}>{ta?QURAN_APP_PROMOTION.tamilLink:QURAN_APP_PROMOTION.englishLink}</a></p>}</footer>
 </main>
}
