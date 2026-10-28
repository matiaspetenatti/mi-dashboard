import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  getEtiquetasConUso,
  getProyectosConResumen,
} from "@/modules/tareas/queries";
import { AjustesGlobales } from "@/modules/tareas/components/ajustes-globales";
import { NavProyectos } from "@/modules/tareas/components/nav-proyectos";

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
  const [etiquetas, proyectos] = await Promise.all([
    getEtiquetasConUso(),
    getProyectosConResumen(),
  ]);

  return (
    <div className="flex gap-6">
      <NavProyectos proyectos={proyectos} className="hidden w-52 shrink-0 lg:block" />
      <AjustesGlobales etiquetas={etiquetas} />
    </div>
  );
}
