import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { ComidaContenido, ComidaSkeleton } from "@/modules/comida/contenido";
import { vistaComida } from "@/modules/comida/constantes";
import { semanaComida } from "@/modules/comida/lib/semana";
import { getComida } from "@/modules/comida/queries";

export const instant = false;

type Params = { vista?: string; semana?: string; items?: string };

function idsSeleccionados(valor: string | undefined) {
  if (!valor) return [];
  return valor
    .split(",")
    .map((parte) => Number(parte))
    .filter((numero) => Number.isInteger(numero) && numero > 0);
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();
  const { vista, semana, items } = await searchParams;
  const data = await getComida(semanaComida(semana));

  return (
    <ComidaContenido
      data={data}
      vista={vistaComida(vista)}
      seleccionInicial={idsSeleccionados(items)}
    />
  );
}

export default async function ComidaPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<ComidaSkeleton />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}
