import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { fechaHoy } from "@/lib/format";
import {
  getEtiquetas,
  getProyectosConResumen,
  getResumenGlobal,
  getTareasGlobales,
} from "@/modules/tareas/queries";
import { TareasOverview } from "@/modules/tareas/components/overview";
import {
  ListaInteligente,
  type ListaInteligenteSlug,
} from "@/modules/tareas/components/lista-inteligente";

const listasValidas: ListaInteligenteSlug[] = [
  "hoy",
  "proximas",
  "vencidas",
  "sin-fecha",
  "completadas",
  "todas",
];

type Params = {
  lista?: string;
  tarea?: string;
  nuevo?: string;
};

function listaValida(valor: string | undefined): ListaInteligenteSlug | null {
  return listasValidas.find((lista) => lista === valor) ?? null;
}

function idValido(valor: string | undefined) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<CargandoTareas />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();
  const params = await searchParams;
  const lista = listaValida(params.lista);
  const tareaAbierta = idValido(params.tarea);
  const hoy = fechaHoy();

  if (lista) {
    const [tareas, proyectos, etiquetas, resumen] = await Promise.all([
      getTareasGlobales(),
      getProyectosConResumen(),
      getEtiquetas(),
      getResumenGlobal(),
    ]);

    return (
      <ListaInteligente
        key={lista}
        lista={lista}
        tareas={tareas}
        proyectos={proyectos}
        resumen={resumen}
        etiquetas={etiquetas}
        tareaAbierta={tareaAbierta}
        hoy={hoy}
      />
    );
  }

  const [proyectos, resumen] = await Promise.all([
    getProyectosConResumen(),
    getResumenGlobal(),
  ]);

  return (
    <TareasOverview
      proyectos={proyectos}
      resumen={resumen}
      abrirNuevo={params.nuevo === "1"}
    />
  );
}

function CargandoTareas() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded-full bg-surface-container-low" />
          <div className="h-10 w-40 animate-pulse rounded-xl bg-surface-container-low" />
          <div className="h-3 w-64 animate-pulse rounded-full bg-surface-container-low" />
        </div>
        <div className="h-9 w-56 animate-pulse rounded-full bg-surface-container-low" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, indice) => (
          <div
            key={indice}
            className="h-[118px] animate-pulse rounded-2xl bg-surface-container-low"
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, indice) => (
          <div
            key={indice}
            className="h-44 animate-pulse rounded-2xl bg-surface-container-low"
          />
        ))}
      </div>
    </div>
  );
}
