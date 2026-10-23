import { Suspense } from "react";
import { NuevaTarea } from "@/modules/tareas/nueva-tarea";
import { TareasContenido } from "@/modules/tareas/tareas-contenido";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; grupo?: string; vista?: string; mes?: string }>;
}) {
  await requireAuthorizedUser();

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Tareas</h1>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-neutral-100" />}>
        <NuevaTarea />
      </Suspense>

      <Suspense fallback={<p className="text-sm text-neutral-500">Cargando tareas...</p>}>
        <TareasContenido searchParams={searchParams} />
      </Suspense>
    </div>
  );
}