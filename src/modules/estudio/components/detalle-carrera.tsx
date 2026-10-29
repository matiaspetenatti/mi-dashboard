"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatearFecha, formatNota } from "@/lib/format";
import type { Cuatrimestre, EstadoMateria, Materia } from "../schema";
import {
  etiquetasCuatrimestre,
  etiquetasEstadoCarrera,
  etiquetasEstadoMateria,
  notasAprobado,
  variantesEstadoCarrera,
} from "../constantes";
import type { DetalleCarreraData, ExamenConContexto } from "../queries";
import { borrarCarrera } from "../actions/carreras";
import { actualizarEstadoMateria, borrarMateria } from "../actions/materias";
import { borrarExamen } from "../actions/examenes";
import { BarraProgreso } from "./barra-progreso";
import { BotonEliminar } from "./boton-eliminar";
import { DialogoCarrera } from "./dialogo-carrera";
import { DialogoExamen } from "./dialogo-examen";
import { DialogoMateria } from "./dialogo-materia";
import { FilaExamen } from "./fila-examen";
import { CalificacionRapida } from "./calificacion-rapida";

type GrupoMaterias = {
  clave: string;
  anio: number | null;
  cuatrimestre: Cuatrimestre | null;
  materias: Materia[];
};

const ordenCuatrimestre: Record<Cuatrimestre, number> = {
  "1": 0,
  "2": 1,
  anual: 2,
};

function agruparMaterias(lista: Materia[]): GrupoMaterias[] {
  const mapa = new Map<string, GrupoMaterias>();

  for (const materia of lista) {
    const clave = `${materia.anio ?? "sin"}-${materia.cuatrimestre ?? "sin"}`;
    const grupo = mapa.get(clave) ?? {
      clave,
      anio: materia.anio,
      cuatrimestre: materia.cuatrimestre,
      materias: [],
    };
    grupo.materias.push(materia);
    mapa.set(clave, grupo);
  }

  const grupos = [...mapa.values()];
  for (const grupo of grupos) {
    grupo.materias.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return grupos.sort((a, b) => {
    const anioA = a.anio ?? 99;
    const anioB = b.anio ?? 99;
    if (anioA !== anioB) return anioA - anioB;

    const cuatrimestreA = a.cuatrimestre
      ? ordenCuatrimestre[a.cuatrimestre]
      : 99;
    const cuatrimestreB = b.cuatrimestre
      ? ordenCuatrimestre[b.cuatrimestre]
      : 99;
    if (cuatrimestreA !== cuatrimestreB) return cuatrimestreA - cuatrimestreB;

    return (a.materias[0]?.nombre ?? "").localeCompare(
      b.materias[0]?.nombre ?? "",
    );
  });
}

export function DetalleCarrera({
  carrera,
  materias,
  examenes,
  resumen,
  hoy,
}: DetalleCarreraData) {
  const router = useRouter();
  const toast = useToast();

  const [carreraAbierta, setCarreraAbierta] = useState(false);
  const [materiaAbierta, setMateriaAbierta] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState<Materia | null>(null);
  const [examenAbierto, setExamenAbierto] = useState(false);
  const [examenEditando, setExamenEditando] =
    useState<ExamenConContexto | null>(null);
  const [actualizandoEstado, setActualizandoEstado] = useState<number | null>(
    null,
  );

  const grupos = agruparMaterias(materias);
  const proximos = examenes.filter(
    (examen) => examen.estado === "programado" && examen.fecha >= hoy,
  );
  const sinCalificar = examenes.filter(
    (examen) => examen.estado === "programado" && examen.fecha < hoy,
  );
  const cerrados = examenes.filter((examen) => examen.estado !== "programado");

  const anios =
    carrera.anioInicio && carrera.anioFin
      ? `${carrera.anioInicio}–${carrera.anioFin}`
      : carrera.anioInicio
        ? `Desde ${carrera.anioInicio}`
        : null;

  function abrirNuevaMateria() {
    setMateriaEditando(null);
    setMateriaAbierta(true);
  }

  function abrirEditarMateria(materia: Materia) {
    setMateriaEditando(materia);
    setMateriaAbierta(true);
  }

  function abrirNuevoExamen() {
    setExamenEditando(null);
    setExamenAbierto(true);
  }

  function abrirEditarExamen(examen: ExamenConContexto) {
    setExamenEditando(examen);
    setExamenAbierto(true);
  }

  async function cambiarEstadoMateria(
    id: number,
    estado: EstadoMateria,
  ) {
    setActualizandoEstado(id);
    const resultado = await actualizarEstadoMateria(id, estado);
    setActualizandoEstado(null);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    router.refresh();
  }

  function accionesExamen(
    examen: ExamenConContexto,
    calificacionRapida = false,
  ) {
    return (
      <>
        {calificacionRapida && <CalificacionRapida examenId={examen.id} />}
        <button
          type="button"
          aria-label="Editar examen"
          onClick={() => abrirEditarExamen(examen)}
          className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
        >
          <Pencil size={14} />
        </button>
        <BotonEliminar
          onEliminar={() => borrarExamen(examen.id)}
          onExito={() => router.refresh()}
          titulo="Eliminar examen"
          descripcion={`Se va a borrar el examen de ${examen.materia} del ${formatearFecha(examen.fecha)}.`}
          ariaLabel="Eliminar examen"
        >
          <Trash2 size={14} />
        </BotonEliminar>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/estudio"
          className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <ArrowLeft size={13} />
          Volver a Estudio
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl"
              style={{
                backgroundColor: `color-mix(in oklab, ${carrera.color} 16%, transparent)`,
                color: `color-mix(in oklab, ${carrera.color} 72%, var(--color-on-surface))`,
              }}
            >
              <GraduationCap size={22} />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight text-on-surface md:text-3xl">
                  {carrera.nombre}
                </h1>
                <Badge variant={variantesEstadoCarrera[carrera.estado]}>
                  {etiquetasEstadoCarrera[carrera.estado]}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                {carrera.institucion ?? "Sin institución"}
                {anios && ` · ${anios}`}
              </p>
              {carrera.notas && (
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-on-surface-variant">
                  {carrera.notas}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outlined"
              size="sm"
              onClick={() => setCarreraAbierta(true)}
            >
              <Pencil />
              Editar
            </Button>
            <BotonEliminar
              onEliminar={() => borrarCarrera(carrera.id)}
              onExito={() => {
                toast.success("Carrera eliminada");
                router.push("/estudio");
              }}
              titulo="Eliminar carrera"
              descripcion={`Se van a borrar "${carrera.nombre}", sus materias y todos sus exámenes. Esta acción no se puede deshacer.`}
              ariaLabel="Eliminar carrera"
            >
              <Trash2 size={15} />
            </BotonEliminar>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Progreso de la carrera
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p
                className="text-4xl font-medium leading-none tracking-tight"
                style={{ color: carrera.color }}
              >
                {resumen.progreso}%
              </p>
              <span className="text-xs text-on-surface-variant">
                {resumen.aprobadas} de {resumen.totalPlan} materias
              </span>
            </div>
          </div>

          <div className="flex gap-6 sm:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Promedio
              </p>
              <p className="mt-1 text-2xl font-medium leading-none text-on-surface">
                {resumen.promedio !== null
                  ? formatNota(resumen.promedio)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Materias
              </p>
              <p className="mt-1 text-2xl font-medium leading-none text-on-surface">
                {resumen.total}
              </p>
            </div>
          </div>
        </div>

        <BarraProgreso
          valor={resumen.progreso}
          color={carrera.color}
          className="mt-4 h-2.5"
        />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              etiqueta: "Aprobadas",
              valor: resumen.aprobadas,
              icono: CheckCircle2,
              clase: "text-success",
            },
            {
              etiqueta: "Regulares",
              valor: resumen.regulares,
              icono: Clock3,
              clase: "text-warning",
            },
            {
              etiqueta: "Cursando",
              valor: resumen.cursando,
              icono: BookOpen,
              clase: "text-primary",
            },
            {
              etiqueta: "Pendientes",
              valor: resumen.pendientes + resumen.libres,
              icono: TrendingUp,
              clase: "text-on-surface-variant",
            },
          ].map((item) => {
            const Icono = item.icono;
            return (
              <div
                key={item.etiqueta}
                className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3 py-2"
              >
                <Icono size={14} className={item.clase} />
                <div>
                  <p className="text-sm font-medium leading-none text-on-surface">
                    {item.valor}
                  </p>
                  <p className="mt-0.5 text-[10px] text-on-surface-variant">
                    {item.etiqueta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Materias
              </h2>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {resumen.total} cargadas · {resumen.aprobadas} aprobadas
              </p>
            </div>
            <Button
              type="button"
              variant="tonal"
              size="sm"
              onClick={abrirNuevaMateria}
            >
              <Plus />
              Agregar materia
            </Button>
          </div>

          {materias.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-10 text-center">
              <BookOpen
                size={22}
                className="mx-auto text-on-surface-variant"
              />
              <p className="mt-2 text-sm font-medium text-on-surface">
                Todavía no cargaste materias
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Agregá la primera para empezar a seguir tu progreso.
              </p>
              <Button
                type="button"
                variant="tonal"
                size="sm"
                className="mt-3"
                onClick={abrirNuevaMateria}
              >
                <Plus />
                Agregar materia
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {grupos.map((grupo) => (
                <div key={grupo.clave} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-on-surface">
                      {grupo.anio
                        ? `${grupo.anio}° año`
                        : "Sin año definido"}
                    </h3>
                    {grupo.cuatrimestre && (
                      <Badge variant="outline">
                        {etiquetasCuatrimestre[grupo.cuatrimestre]}
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {grupo.materias.map((materia) => (
                      <li
                        key={materia.id}
                        className="flex items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-on-surface">
                              {materia.nombre}
                            </p>
                            {materia.creditos !== null && (
                              <Badge variant="neutral">
                                {materia.creditos} créditos
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-on-surface-variant">
                            {materia.profesor ?? "Sin profesor"}
                            {materia.notas && ` · ${materia.notas}`}
                          </p>
                        </div>

                        {materia.notaFinal !== null && (
                          <Badge
                            variant={
                              materia.notaFinal >= notasAprobado
                                ? "success"
                                : "destructive"
                            }
                          >
                            {formatNota(materia.notaFinal)}
                          </Badge>
                        )}

                        <select
                          value={materia.estado}
                          disabled={actualizandoEstado === materia.id}
                          onChange={(event) =>
                            cambiarEstadoMateria(
                              materia.id,
                              event.target.value as EstadoMateria,
                            )
                          }
                          aria-label={`Estado de ${materia.nombre}`}
                          className="h-7 rounded-full border border-outline-variant/60 bg-surface-container-low px-2 text-[11px] font-medium text-on-surface outline-none focus:border-primary disabled:opacity-60"
                        >
                          {(
                            Object.keys(
                              etiquetasEstadoMateria,
                            ) as EstadoMateria[]
                          ).map((valor) => (
                            <option key={valor} value={valor}>
                              {etiquetasEstadoMateria[valor]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          aria-label="Editar materia"
                          onClick={() => abrirEditarMateria(materia)}
                          className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
                        >
                          <Pencil size={14} />
                        </button>

                        <BotonEliminar
                          onEliminar={() => borrarMateria(materia.id)}
                          onExito={() => router.refresh()}
                          titulo="Eliminar materia"
                          descripcion={`Se va a borrar "${materia.nombre}" y todos sus exámenes.`}
                          ariaLabel="Eliminar materia"
                        >
                          <Trash2 size={14} />
                        </BotonEliminar>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Exámenes
              </h2>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {examenes.length} registrados
              </p>
            </div>
            <Button
              type="button"
              variant="tonal"
              size="sm"
              disabled={materias.length === 0}
              onClick={abrirNuevoExamen}
              title={
                materias.length === 0
                  ? "Primero agregá una materia"
                  : undefined
              }
            >
              <Plus />
              Agregar examen
            </Button>
          </div>

          {examenes.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-outline-variant/70 bg-surface-container-lowest/60 px-4 py-8 text-center text-sm text-on-surface-variant">
              No hay exámenes cargados.
            </p>
          ) : (
            <div className="space-y-4">
              {proximos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    <CalendarClock size={12} />
                    Próximos
                  </h3>
                  <ul className="space-y-2">
                    {proximos.map((examen) => (
                      <FilaExamen key={examen.id} examen={examen} hoy={hoy}>
                        {accionesExamen(examen)}
                      </FilaExamen>
                    ))}
                  </ul>
                </div>
              )}

              {sinCalificar.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
                    Pendientes de calificación
                  </h3>
                  <ul className="space-y-2">
                    {sinCalificar.map((examen) => (
                      <FilaExamen key={examen.id} examen={examen} hoy={hoy}>
                        {accionesExamen(examen, true)}
                      </FilaExamen>
                    ))}
                  </ul>
                </div>
              )}

              {cerrados.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    Rendidos y ausentes
                  </h3>
                  <ul className="space-y-2">
                    {cerrados.map((examen) => (
                      <FilaExamen key={examen.id} examen={examen} hoy={hoy}>
                        {accionesExamen(examen)}
                      </FilaExamen>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <DialogoCarrera
        key={`carrera-${carreraAbierta ? "abierta" : "cerrada"}-${carrera.id}`}
        abierto={carreraAbierta}
        onOpenChange={setCarreraAbierta}
        carrera={carrera}
      />
      <DialogoMateria
        key={`materia-${materiaAbierta ? "abierta" : "cerrada"}-${materiaEditando?.id ?? "nueva"}`}
        abierto={materiaAbierta}
        onOpenChange={setMateriaAbierta}
        carreraId={carrera.id}
        materia={materiaEditando}
      />
      <DialogoExamen
        key={`examen-${examenAbierto ? "abierto" : "cerrado"}-${examenEditando?.id ?? "nuevo"}`}
        abierto={examenAbierto}
        onOpenChange={setExamenAbierto}
        materias={materias}
        hoy={hoy}
        examen={examenEditando}
      />
    </div>
  );
}
