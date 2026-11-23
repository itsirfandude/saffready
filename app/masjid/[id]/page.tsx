import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientDetail } from "@/components/ClientDetail";
import { getMasjid } from "@/src/lib/data";
export default async function MasjidPage({params}:{params:Promise<{id:string}>}){const {id}=await params; const masjid=getMasjid(id); if(!masjid)notFound(); return <ClientDetail masjid={masjid}/>}
