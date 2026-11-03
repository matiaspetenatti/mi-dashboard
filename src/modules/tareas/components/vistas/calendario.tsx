"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { Etiqueta } from "@/modules/tareas/schema";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";
import { filtrarTareas } from "@/modules/tareas/lib/filtrar";
import { nombreMes, sumarFecha } from "@/lib/format";
import { cn } from "cn";
import { useState } from "react";

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function construirMes(mes: string) {
  const [anio, numero] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(anio, numero - 1, 1));
  const desplazamiento = (primero.getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(anio, numero, 0)).getUTCDate();
  const celdas: Array<string | null> = Array.from(
    { length: desplazamiento },
    () => null,
  );
  for (let dia = 1; dia <= total; dia += 1) {
    celdas.push(
      `${anio}-${String(numero).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
    );
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

function TareaArrastrable({
  tarea,
  onAbrir,
}: {
  tarea: TareaConDetalle;
  onAbrir: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tarea.id,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onAbrir(tarea.id)}
      title={tarea.titulo}
      className={cn(
        "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-colors hover:brightness-95",
        isDragging && "opacity-40",
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${tarea.estado.color} 16%, transparent)`,
        color: `color-mix(in oklab, ${tarea.estado.color} 72%, var(--color-on-surface))`,
      }}
      {...listeners}
      {...attributes}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: tarea.estado.color }}
      />
      <span className="truncate">{tarea.titulo}</span>
    </button>
  );
}

function CeldaVacia({ id }: { id: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="min-h-24 border-b border-r border-outline-variant/40 bg-surface-container-low/30 last:border-r-0"
    />
  );
}

function CeldaDia({
  fecha,
  esHoy,
  delDia,
  onAbrir,
}: {
  fecha: string;
  esHoy: boolean;
  delDia: TareaConDetalle[];
  onAbrir: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: fecha });
  const visiblesDia = delDia.slice(0, 3);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-24 border-b border-r border-outline-variant/40 p-1.5 transition-colors",
        esHoy && "bg-primary-container/25",
        isOver && "bg-primary/10",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full text-[11px] text-on-surface-variant",
            esHoy && "bg-primary text-on-primary",
          )}
        >
          {Number(fecha.slice(8))}
        </span>
        {delDia.length > 3 && (
          <span className="text-[9px] text-on-surface-variant">
            +{delDia.length - 3}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {visiblesDia.map((tarea) => (
          <TareaArrastrable key={tarea.id} tarea={tarea} onAbrir={onAbrir} />
        ))}
      </div>
    </div>
  );
}

export function VistaCalendario({
  tareas,
  config,
  mes,
  hoy,
  onCambiarMes,
  onAbrir,
  onMoverFecha,
}: {
  tareas: TareaConDetalle[];
  etiquetas: Etiqueta[];
  config: ConfigVista;
  mes: string;
  hoy: string;
  onCambiarMes: (mes: string) => void;
  onAbrir: (id: number) => void;
  onMoverFecha?: (id: number, fecha: string) => void;
}) {
  const visibles = filtrarTareas(tareas, config, hoy);
  const celdas = construirMes(mes);

  const porFecha = new Map<string, TareaConDetalle[]>();
  for (const tarea of visibles) {
    if (!tarea.fechaLimite) continue;
    porFecha.set(tarea.fechaLimite, [
      ...(porFecha.get(tarea.fechaLimite) ?? []),
      tarea,
    ]);
  }

  const sinFecha = visibles.filter((tarea) => !tarea.fechaLimite);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activo, setActivo] = useState<TareaConDetalle | null>(null);

  function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    setActivo(null);
    if (!over) return;
    const id = Number(active.id);
    const fecha = String(over.id);
    if (!fecha || fecha.startsWith("vacio")) return;
    onMoverFecha?.(id, fecha);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        const t = visibles.find((x) => x.id === Number(e.active.id));
        setActivo(t ?? null);
      }}
      onDragEnd={alSoltar}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => onCambiarMes(sumarFecha(`${mes}-01`, "mes", -1).slice(0, 7))}
            className="grid size-8 place-items-center rounded-full border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low"
          >
            <ChevronLeft size={15} />
          </button>
          <h2 className="min-w-36 text-center text-sm font-semibold text-on-surface">
            {nombreMes(mes, true)}
          </h2>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => onCambiarMes(sumarFecha(`${mes}-01`, "mes", 1).slice(0, 7))}
            className="grid size-8 place-items-center rounded-full border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low"
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => onCambiarMes(hoy.slice(0, 7))}
            className="rounded-full border border-outline-variant/60 px-3 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low"
          >
            Hoy
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
          <div className="grid grid-cols-7 border-b border-outline-variant/60 bg-surface-container-low/70">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {celdas.map((fecha, indice) => {
              if (!fecha) {
                return <CeldaVacia key={`vacio-${indice}`} id={`vacio-${indice}`} />;
              }

              const esHoy = fecha === hoy;
              const delDia = (porFecha.get(fecha) ?? []).sort(
                (a, b) => a.posicion - b.posicion || a.id - b.id,
              );

              return (
                <CeldaDia
                  key={fecha}
                  fecha={fecha}
                  esHoy={esHoy}
                  delDia={delDia}
                  onAbrir={onAbrir}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activo ? (
            <div className="rounded bg-primary/90 px-2 py-1 text-[10px] text-on-primary">
              {activo.titulo}
            </div>
          ) : null}
        </DragOverlay>

        {sinFecha.length > 0 && (
          <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Sin fecha · {sinFecha.length}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sinFecha.map((tarea) => (
                <button
                  key={tarea.id}
                  type="button"
                  onClick={() => onAbrir(tarea.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-2.5 py-1 text-xs text-on-surface hover:bg-surface-container-low"
                >
                  <Plus size={10} className="text-on-surface-variant" />
                  <span className="max-w-52 truncate">{tarea.titulo}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </DndContext>
  );
}