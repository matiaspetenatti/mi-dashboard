import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { getEtiquetasConUso } from "@/modules/tareas/queries";
import { AjustesGlobales } from "@/modules/tareas/components/ajustes-globales";

export default async function AjustesTareasPage() {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface-container-low" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await connection();
  const etiquetas = await getEtiquetasConUso();

  return (
    <div>
      <AjustesGlobales etiquetas={etiquetas} />
    </div>
  );
}
