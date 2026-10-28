import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { fechaHoy, mesActual } from "@/lib/format";
import {
  getProyectoWorkspace,
  getProyectosConResumen,
} from "@/modules/tareas/queries";
import { Workspace } from "@/modules/tareas/components/workspace";

type Params = { slug: string };
type Search = { vista?: string; tarea?: string; mes?: string };

function idValido(valor: string | undefined) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function mesValido(valor: string | undefined) {
  return valor && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor) ? valor : mesActual();
}

export default async function ProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<CargandoProyecto />}>
      <Contenido params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  await connection();
  const { slug } = await params;
  const search = await searchParams;

  const [workspace, resumen] = await Promise.all([
    getProyectoWorkspace(slug),
    getProyectosConResumen(),
  ]);
  if (!workspace) notFound();

  return (
    <Workspace
      proyecto={workspace.proyecto}
      estados={workspace.estados}
      vistas={workspace.vistas}
      tareas={workspace.tareas}
      etiquetas={workspace.etiquetas}
      resumen={resumen}
      vistaInicial={idValido(search.vista)}
      tareaAbierta={idValido(search.tarea)}
      mes={mesValido(search.mes)}
      hoy={fechaHoy()}
    />
  );
}

function CargandoProyecto() {
  return (
    <div className="flex gap-6">
      <div className="hidden w-52 shrink-0 lg:block">
        <div className="h-[420px] animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="h-24 animate-pulse rounded-3xl bg-surface-container-low" />
        <div className="h-10 animate-pulse rounded-full bg-surface-container-low" />
        <div className="h-12 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    </div>
  );
}
