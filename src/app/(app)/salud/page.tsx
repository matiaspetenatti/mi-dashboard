import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { SaludContenido, SaludSkeleton } from "@/modules/salud/contenido";
import { vistaSalud } from "@/modules/salud/constantes";
import { fechaHoraAhora } from "@/modules/salud/lib/fechas";
import { getSalud } from "@/modules/salud/queries";

export const instant = false;

type Params = { vista?: string };

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();
  const { vista } = await searchParams;
  const data = await getSalud();
  const ahora = fechaHoraAhora();

  return (
    <SaludContenido data={data} vista={vistaSalud(vista)} ahora={ahora} />
  );
}

export default async function SaludPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<SaludSkeleton />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}
