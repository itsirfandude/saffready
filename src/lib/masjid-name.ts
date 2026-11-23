import type {Masjid} from "@/src/types/masjid";
export function masjidName(masjid:Masjid,language:"ta"|"en"){return language==="ta"?(masjid.name_ta?.trim()||masjid.name_en):masjid.name_en}
