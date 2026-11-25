import type {IqamahValue} from "@/src/types/masjid";
import {formatTime,type TimeFormat} from "@/src/lib/format-time";
import {resolveIqamah} from "@/src/lib/scheduling";
export function isImmediateIqamah(value:IqamahValue){return value==="immediate" || Boolean(value && typeof value!=="string" && (value.type==="immediate" || value.offsetMin===0));}
export function formatImmediateIqamahLabel(language:"ta"|"en"){return language==="ta"?"அதானுக்குப் பிறகு உடனே":"Immediately after Adhan";}
export function formatIqamahValue(value:IqamahValue,adhan:string|null,language:"ta"|"en",timeFormat:TimeFormat="12h"){
  if(isImmediateIqamah(value)) return formatTime(resolveIqamah({iqamah:value,adhan}),timeFormat);
  if(value===null)return formatTime(null,timeFormat);
  if(typeof value==="string")return formatTime(value,timeFormat);
  if(!resolveIqamah({iqamah:value,adhan}))return formatTime(null,timeFormat);
  if(value&&typeof value!=="string"&&value.type==="after_adhan") return language==="ta"?`${value.offsetMin} நிமிடங்கள் கழித்து`:`After ${value.offsetMin} min`;
  return formatTime(null,timeFormat);
}
