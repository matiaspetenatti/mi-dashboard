import { CheckSquare } from "lucide-react";
import { connection } from "next/server";
import { WidgetCard } from "@/components/widget-card";
import { CountUp } from "@/components/motion/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { fechaHoy } from "@/lib/format";
import { getPendientesCount, getProximasTareas } from "./queries";
import { textoVencimiento } from "./constantes";

export function TareasWidgetSkeleton() {
  return (
    <WidgetCard
      title="Tareas pendientes"
      href="/tareas"
      icon={CheckSquare}
      accent="primary"
    >
      <div className="space-y-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-3.5 w-28" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-9 w-3/5" />
        </div>
      </div>
    </WidgetCard>
  );
}

export async function TareasWidget() {
  const [total, proximas] = await Promise.all([
    getPendientesCount(),
    getProximasTareas(3),
  ]);
  await connection();
  const hoy = fechaHoy();

  return (
    <WidgetCard
      title="Tareas pendientes"
      href="/tareas"
      icon={CheckSquare}
      accent="primary"
    >
      <div className="flex items-end gap-2.5">
        <CountUp
          value={total}
          className="text-4xl font-medium leading-none tracking-tight text-on-surface"
        />
        <span className="pb-1 text-sm text-on-surface-variant">
          {total === 1 ? "pendiente" : "pendientes"}
        </span>
      </div>

      {proximas.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-primary-container/45 px-3 py-3 text-sm text-on-primary-container">
          Todo al día 🎉
        </div>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {proximas.map((tarea) => (
            <li
              key={tarea.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-container"
            >
              <span className="min-w-0">
                <span className="block truncate text-on-surface">
                  {tarea.titulo}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: tarea.proyectoColor }}
                  />
                  {tarea.proyectoNombre}
                </span>
              </span>
              {tarea.fechaLimite && (
                <span className="shrink-0 text-[11px] font-medium text-on-surface-variant">
                  {textoVencimiento(tarea.fechaLimite, hoy)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
