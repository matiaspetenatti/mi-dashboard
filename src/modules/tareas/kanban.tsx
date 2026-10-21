"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { Repeat } from "lucide-react";
import { moverTarea } from "./actions";
import type { TareaConDetalle } from "./queries";
import { columnaDe, columnas, textoRecurrencia, type Columna } from "./constantes";
import { GrupoBadge, TagChip } from "./chips";

function Tarjeta({ tarea }: { tarea: TareaConDetalle }) {
    const hechas = tarea.subtareas.filter((s) => s.completada).length;
    return (
        <div className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">
            <Link
                href={`/tareas/${tarea.id}/editar`}
                className={`block text-sm hover:underline ${tarea.completada ? "text-neutral-400 line-through" : ""}`}
            >
                {tarea.titulo}
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                {tarea.fechaLimite && <span>{tarea.fechaLimite}</span>}
                {tarea.recurrencia && (
                    <span className="inline-flex items-center gap-1">
                        <Repeat size={12} />
                        {textoRecurrencia(tarea.recurrencia, tarea.recurrenciaCada)}
                    </span>
                )}
                {tarea.subtareas.length > 0 && (
                    <span>
                        {hechas}/{tarea.subtareas.length} subtareas
                    </span>
                )}
            </div>
            {(tarea.grupo || tarea.tags.length > 0) && (
                <div className="flex flex-wrap gap-1">
                    {tarea.grupo && <GrupoBadge grupo={tarea.grupo} />}
                    {tarea.tags.map((t) => (
                        <TagChip key={t.nombre} tag={t} />
                    ))}
                </div>
            )}
        </div>
    );
}

function TarjetaArrastrable({ tarea }: { tarea: TareaConDetalle }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: tarea.id });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-40" : ""}>
            <Tarjeta tarea={tarea} />
        </div>
    );
}

function ColumnaKanban({ id, titulo, tareas }: { id: Columna; titulo: string; tareas: TareaConDetalle[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <section
            ref={setNodeRef}
            className={`min-h-40 space-y-2 rounded-xl border p-3 transition-colors ${isOver ? "bg-neutral-100 ring-2 ring-neutral-300" : "bg-neutral-50"
                }`}
        >
            <h2 className="flex items-center justify-between text-sm font-medium text-neutral-500">
                {titulo}
                <span className="text-xs">{tareas.length}</span>
            </h2>
            {tareas.map((t) => (
                <TarjetaArrastrable key={t.id} tarea={t} />
            ))}
        </section>
    );
}

export function Kanban({ tareas }: { tareas: TareaConDetalle[] }) {
    const [items, moverOptimista] = useOptimistic(
        tareas,
        (estado, { id, columna }: { id: number; columna: Columna }) =>
            estado.map((t) =>
                t.id === id ? { ...t, completada: columna === "hecha", enCurso: columna === "en_curso" } : t,
            ),
    );
    const [, startTransition] = useTransition();
    const [activaId, setActivaId] = useState<number | null>(null);

    const sensors = useSensors(
        // distance/delay: permite hacer clic en el título sin arrancar un arrastre
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    );

    function alSoltar(e: DragEndEvent) {
        setActivaId(null);
        const id = Number(e.active.id);
        const destino = e.over?.id as Columna | undefined;
        const tarea = items.find((t) => t.id === id);
        if (!destino || !tarea || columnaDe(tarea) === destino) return;

        startTransition(async () => {
            moverOptimista({ id, columna: destino });
            await moverTarea(id, destino);
        });
    }

    const activa = items.find((t) => t.id === activaId);

    return (
        <DndContext
            id="kanban" // id fijo: evita warnings de hidratación
            sensors={sensors}
            onDragStart={(e) => setActivaId(Number(e.active.id))}
            onDragEnd={alSoltar}
            onDragCancel={() => setActivaId(null)}
        >
            <div className="grid gap-4 md:grid-cols-3">
                {columnas.map((c) => (
                    <ColumnaKanban
                        key={c.id}
                        id={c.id}
                        titulo={c.titulo}
                        tareas={items.filter((t) => columnaDe(t) === c.id)}
                    />
                ))}
            </div>
            <DragOverlay>{activa ? <Tarjeta tarea={activa} /> : null}</DragOverlay>
        </DndContext>
    );
}