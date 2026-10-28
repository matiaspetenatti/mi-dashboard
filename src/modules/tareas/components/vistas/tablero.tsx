"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarClock, ListChecks } from "lucide-react";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";
import { filtrarTareas } from "@/modules/tareas/lib/filtrar";
import { moverTarea } from "@/modules/tareas/actions/tareas";
import { textoVencimiento } from "@/modules/tareas/constantes";
import { cn } from "cn";
import { Checkbox } from "../ui/checkbox";
import { EtiquetaChip, PrioridadChip } from "../chips";

function porPosicion(a: TareaConDetalle, b: TareaConDetalle) {
  return a.posicion - b.posicion || a.id - b.id;
}

function TarjetaContenido({
  tarea,
  hoy,
  onAlternar,
  mostrarProyecto,
  arrastrando = false,
}: {
  tarea: TareaConDetalle;
  hoy: string;
  onAlternar: () => void;
  mostrarProyecto: boolean;
  arrastrando?: boolean;
}) {
  const completada = tarea.estado.categoria === "completado";
  const vencimiento = textoVencimiento(tarea.fechaLimite, hoy);
  const vencida =
    !completada && tarea.fechaLimite !== null && tarea.fechaLimite < hoy;

  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-2.5 shadow-elevation-1 transition-shadow",
        arrastrando && "rotate-1 shadow-elevation-4",
        completada && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={completada}
          ariaLabel={completada ? "Marcar como pendiente" : "Marcar como hecha"}
          onChange={onAlternar}
          className="mt-0.5"
        />
        <p
          className={cn(
            "min-w-0 flex-1 text-[13px] font-medium leading-snug text-on-surface",
            completada && "text-on-surface-variant line-through",
          )}
        >
          {tarea.titulo}
        </p>
      </div>

      {(tarea.etiquetas.length > 0 || tarea.prioridad) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {tarea.prioridad && <PrioridadChip prioridad={tarea.prioridad} />}
          {tarea.etiquetas.slice(0, 3).map((etiqueta) => (
            <EtiquetaChip key={etiqueta.id} etiqueta={etiqueta} />
          ))}
          {tarea.etiquetas.length > 3 && (
            <span className="text-[10px] text-on-surface-variant">
              +{tarea.etiquetas.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-on-surface-variant">
        {vencimiento && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              vencida && "font-medium text-error",
            )}
          >
            <CalendarClock size={10} />
            {vencimiento}
          </span>
        )}
        {tarea.subtareas.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks size={10} />
            {tarea.subtareasCompletadas}/{tarea.subtareas.length}
          </span>
        )}
        {mostrarProyecto && (
          <span className="ml-auto inline-flex max-w-[9rem] items-center gap-1 truncate">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: tarea.proyecto.color }}
            />
            <span className="truncate">{tarea.proyecto.nombre}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function TarjetaArrastrable({
  tarea,
  hoy,
  onAbrir,
  onAlternar,
  mostrarProyecto,
}: {
  tarea: TareaConDetalle;
  hoy: string;
  onAbrir: () => void;
  onAlternar: () => void;
  mostrarProyecto: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition: transition ?? undefined,
      }}
      className={cn("touch-none", isDragging && "z-10 opacity-40")}
      onClick={onAbrir}
      {...attributes}
      {...listeners}
    >
      <TarjetaContenido
        tarea={tarea}
        hoy={hoy}
        onAlternar={onAlternar}
        mostrarProyecto={mostrarProyecto}
      />
    </div>
  );
}

function ColumnaTablero({
  estado,
  tareas,
  hoy,
  onAbrir,
  onAlternar,
  mostrarProyecto,
}: {
  estado: EstadoProyecto;
  tareas: TareaConDetalle[];
  hoy: string;
  onAbrir: (id: number) => void;
  onAlternar: (id: number) => void;
  mostrarProyecto: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${estado.id}` });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[272px] shrink-0 flex-col gap-2 rounded-2xl border border-outline-variant/50 bg-surface-container-low/60 p-2.5 transition-colors",
        isOver && "border-primary/40 bg-primary-container/20",
      )}
    >
      <header className="flex items-center gap-1.5 px-1">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: estado.color }}
        />
        <h2 className="text-xs font-semibold text-on-surface">{estado.nombre}</h2>
        <span className="rounded-full bg-surface-container px-1.5 text-[10px] font-medium text-on-surface-variant">
          {tareas.length}
        </span>
      </header>

      <SortableContext
        items={tareas.map((tarea) => tarea.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-16 flex-col gap-2">
          {tareas.map((tarea) => (
            <TarjetaArrastrable
              key={tarea.id}
              tarea={tarea}
              hoy={hoy}
              onAbrir={() => onAbrir(tarea.id)}
              onAlternar={() => onAlternar(tarea.id)}
              mostrarProyecto={mostrarProyecto}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export function VistaTablero({
  tareas,
  estados,
  config,
  hoy,
  onAbrir,
  onAlternar,
  mostrarProyecto = false,
}: {
  tareas: TareaConDetalle[];
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  config: ConfigVista;
  hoy: string;
  onAbrir: (id: number) => void;
  onAlternar: (id: number) => void;
  mostrarProyecto?: boolean;
}) {
  const router = useRouter();
  const [activaId, setActivaId] = useState<number | null>(null);
  const [items, aplicarOptimista] = useOptimistic(
    tareas,
    (_actual: TareaConDetalle[], siguientes: TareaConDetalle[]) => siguientes,
  );
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const visibles = filtrarTareas(items, config, hoy);

  function alSoltar(evento: DragEndEvent) {
    setActivaId(null);
    const { active, over } = evento;
    if (!over) return;

    const id = Number(active.id);
    const tarea = items.find((item) => item.id === id);
    if (!tarea) return;

    const sobreId = Number(String(over.id).replace("col-", ""));
    const destino =
      items.find((item) => item.id === sobreId) ??
      items.find((item) => item.estadoId === sobreId);
    const destinoId = String(over.id).startsWith("col-")
      ? sobreId
      : destino?.estadoId;
    if (!destinoId) return;

    let nuevas: TareaConDetalle[];
    if (tarea.estadoId === destinoId) {
      const columna = items
        .filter((item) => item.estadoId === destinoId)
        .sort(porPosicion);
      const desde = columna.findIndex((item) => item.id === id);
      const hasta = String(over.id).startsWith("col-")
        ? columna.length - 1
        : columna.findIndex((item) => item.id === sobreId);
      if (desde < 0 || hasta < 0 || desde === hasta) return;
      nuevas = arrayMove(columna, desde, hasta);
    } else {
      const destinoTareas = items
        .filter((item) => item.estadoId === destinoId && item.id !== id)
        .sort(porPosicion);
      const indice = String(over.id).startsWith("col-")
        ? destinoTareas.length
        : destinoTareas.findIndex((item) => item.id === sobreId);
      const posicion = indice < 0 ? destinoTareas.length : indice;
      nuevas = [
        ...destinoTareas.slice(0, posicion),
        { ...tarea, estadoId: destinoId },
        ...destinoTareas.slice(posicion),
      ];
    }

    const actualizadas = new Map(
      nuevas.map((item, indice) => [
        item.id,
        { ...item, estadoId: destinoId, posicion: (indice + 1) * 1024 },
      ]),
    );
    const siguientes = items.map((item) => actualizadas.get(item.id) ?? item);

    const ids = nuevas.map((item) => item.id);
    startTransition(async () => {
      aplicarOptimista(siguientes);
      const resultado = await moverTarea(id, destinoId, ids);
      if (!resultado.ok) return;
      router.refresh();
    });
  }

  function alEmpezar(evento: DragStartEvent) {
    setActivaId(Number(evento.active.id));
  }

  const activa = items.find((item) => item.id === activaId) ?? null;

  return (
    <DndContext
      id="tablero-tareas"
      sensors={sensors}
      onDragStart={alEmpezar}
      onDragEnd={alSoltar}
      onDragCancel={() => setActivaId(null)}
    >
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
        {estados.map((estado) => (
          <ColumnaTablero
            key={estado.id}
            estado={estado}
            tareas={visibles
              .filter((tarea) => tarea.estadoId === estado.id)
              .sort(porPosicion)}
            hoy={hoy}
            onAbrir={onAbrir}
            onAlternar={onAlternar}
            mostrarProyecto={mostrarProyecto}
          />
        ))}
      </div>
      <DragOverlay>
        {activa ? (
          <div className="w-[272px]">
            <TarjetaContenido
              tarea={activa}
              hoy={hoy}
              onAlternar={() => {}}
              mostrarProyecto={mostrarProyecto}
              arrastrando
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
