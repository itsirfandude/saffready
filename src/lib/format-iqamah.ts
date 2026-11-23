import type {IqamahValue} from "@/src/types/masjid";
import {formatTime,type TimeFormat} from "@/src/lib/format-time";
export function formatIqamahValue(value:IqamahValue,adhan:string|null,language:"ta"|"en",timeFormat:TimeFormat="12h"){
  if(value&&typeof value!=="string") return value.offsetMin===0?(language==="ta"?"உடன்":"Immediately"):(language==="ta"?`${value.offsetMin} நிமிடங்கள் கழித்து`:`After ${value.offsetMin} min`);
  return formatTime(typeof value==="string"?value:adhan,timeFormat);
}
