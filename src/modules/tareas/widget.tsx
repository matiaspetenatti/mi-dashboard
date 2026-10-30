import Link from "next/link";
import {
  CheckCircle2,
  CheckSquare,
  Plus,
  RefreshCw,
} from "lucide-react";
import { connection } from "next/server";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fechaHoy } from "@/lib/format";
import { getPendientesCount, getProximasTareas } from "./queries";
import { textoVencimiento } from "./constantes";

export function TareasWidgetSkeleton() {
  return (
    <WidgetCard
      title="Tareas pendientes"
      subtitle="Cargando pendientes"
      href="/tareas"
      icon={CheckSquare}
      accent="primary"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-[58px] w-full rounded-[14px]" />
        <Skeleton className="h-[58px] w-full rounded-[14px]" />
        <Skeleton className="h-[58px] w-full rounded-[14px]" />
      </div>
    </WidgetCard>
  );
}

export async function TareasWidget() {
  let total: number;
  let proximas: Awaited<ReturnType<typeof getProximasTareas>>;
  let hoy: string;

  try {
    [total, proximas] = await Promise.all([
      getPendientesCount(),
      getProximasTareas(3),
    ]);
    await connection();
    hoy = fechaHoy();
  } catch {
    return <TareasWidgetError />;
  }

  return (
    <WidgetCard
      title="Tareas pendientes"
      subtitle={`${total} ${total === 1 ? "pendiente" : "pendientes"} en tus proyectos`}
      href="/tareas"
      icon={CheckSquare}
      accent="primary"
      footer={
        <>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw size={13} />
            Sincronizado con tu base
          </span>
          <Link
            href="/tareas"
            className="inline-flex items-center gap-1 rounded-full bg-lime-voltage px-3.5 py-2 text-xs font-bold text-forest-ink transition-[filter] duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            <Plus size={13} />
            Nueva tarea
          </Link>
        </>
      }
    >
      {proximas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-outline-variant/70 bg-surface-bright px-4 py-6 text-center">
          <CheckCircle2 size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">Todo al día 🎉</p>
          <p className="text-xs text-on-surface-variant">
            No tenés tareas pendientes por ahora.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {proximas.map((tarea) => {
            const vencida = Boolean(
              tarea.fechaLimite && tarea.fechaLimite < hoy,
            );
            const vence = textoVencimiento(tarea.fechaLimite, hoy);

            return (
              <li key={tarea.id}>
                <Link
                  href="/tareas"
                  className="group/tarea flex items-center gap-3 rounded-[14px] border border-outline-variant/60 bg-surface-bright p-3 transition-colors duration-200 hover:bg-surface-container"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-[18px] shrink-0 place-items-center rounded-[4px] border border-pebble/60 text-transparent transition-colors group-hover/tarea:border-primary group-hover/tarea:text-primary"
                  >
                    <CheckCircle2 size={11} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-on-surface">
                      {tarea.titulo}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-on-surface-variant">
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tarea.proyectoColor }}
                      />
                      <span className="truncate">{tarea.proyectoNombre}</span>
                      {vence && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              vencida
                                ? "shrink-0 font-semibold text-alarm-red"
                                : "shrink-0"
                            }
                          >
                            {vence}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

export function TareasWidgetError() {
  return (
    <WidgetCard
      title="Tareas pendientes"
      href="/tareas"
      icon={CheckSquare}
      accent="primary"
    >
      <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
        <CheckSquare className="mx-auto h-6 w-6 text-on-surface-variant opacity-60" />
        <p className="text-sm font-medium text-on-surface">
          No se pudieron cargar las tareas
        </p>
        <p className="text-xs text-on-surface-variant">
          Entrá al módulo de Tareas para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}
