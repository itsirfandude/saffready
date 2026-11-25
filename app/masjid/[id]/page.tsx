import { notFound } from "next/navigation";
import { ClientDetail } from "@/components/ClientDetail";
import { masjids as bundledMasjids } from "@/src/lib/data";
import { getMasjidForDetail, MasjidNotFoundError } from "@/src/lib/masjid-detail";
import { getLiveTimetable } from "@/src/lib/server-timetable";

export default async function MasjidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const masjid = await getMasjidForDetail(id, getLiveTimetable, bundledMasjids);
    return <ClientDetail masjid={masjid} />;
  } catch (error) {
    if (error instanceof MasjidNotFoundError) notFound();
    throw error;
  }
}
