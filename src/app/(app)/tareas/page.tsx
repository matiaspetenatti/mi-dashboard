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
    const [tareas, proyectos, etiquetas] = await Promise.all([
      getTareasGlobales(),
      getProyectosConResumen(),
      getEtiquetas(),
    ]);

    return (
      <ListaInteligente
        key={lista}
        lista={lista}
        tareas={tareas}
        proyectos={proyectos}
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
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-surface-container-low" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, indice) => (
          <div
            key={indice}
            className="h-24 animate-pulse rounded-2xl bg-surface-container-low"
          />
        ))}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <div
            key={indice}
            className="h-40 animate-pulse rounded-2xl bg-surface-container-low"
          />
        ))}
      </div>
    </div>
  );
}
