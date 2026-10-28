import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  getProyectoWorkspace,
  getProyectosConResumen,
} from "@/modules/tareas/queries";
import { AjustesProyecto } from "@/modules/tareas/components/ajustes-proyecto";
import { NavProyectos } from "@/modules/tareas/components/nav-proyectos";

export default async function AjustesProyectoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface-container-low" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const workspace = await getProyectoWorkspace(slug);
  if (!workspace) notFound();

  const resumen = await getProyectosConResumen();

  return (
    <div className="flex gap-6">
      <NavProyectos
        proyectos={resumen}
        slugActivo={slug}
        className="hidden w-52 shrink-0 lg:block"
      />
      <AjustesProyecto
        proyecto={workspace.proyecto}
        estados={workspace.estados}
        vistas={workspace.vistas}
      />
    </div>
  );
}
