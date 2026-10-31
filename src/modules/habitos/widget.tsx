import Link from "next/link";
import { Activity, ChevronRight, Flame } from "lucide-react";
import { cn } from "cn";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHabitos, getRegistrosPorFecha, getGithubActividad } from "./queries";
import type { Habito } from "./schema";

const HOY = new Date().toISOString().slice(0, 10);

export function HabitosWidgetSkeleton() {
  return (
    <WidgetCard
      title="Hábitos"
      subtitle="Seguimiento diario"
      href="/habitos"
      icon={Activity}
      accent="secondary"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-[122px] w-full rounded-[16px]" />
        <Skeleton className="h-[122px] w-full rounded-[16px]" />
      </div>
    </WidgetCard>
  );
}

export function HabitosWidgetError() {
  return (
    <WidgetCard
      title="Hábitos"
      subtitle="Seguimiento diario"
      href="/habitos"
      icon={Activity}
      accent="secondary"
    >
      <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
        <Activity className="mx-auto h-6 w-6 text-on-surface-variant opacity-60" />
        <p className="text-sm font-medium text-on-surface">
          No se pudieron cargar los hábitos
        </p>
        <p className="text-xs text-on-surface-variant">
          Entrá al módulo de Hábitos para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}

export async function HabitosWidget() {
  let habitos: Habito[] = [];
  let completadosHoy = 0;
  let totalCommits = 0;

  try {
    const [hs, rh, ga] = await Promise.all([
      getHabitos(true),
      getRegistrosPorFecha(HOY),
      getGithubActividad(),
    ]);
    habitos = hs;
    completadosHoy = rh.filter((r) => r.completado).length;
    totalCommits = ga.reduce((sum, g) => sum + g.commits, 0);
  } catch {
    return <HabitosWidgetError />;
  }

  const rachaMasLarga = 0; // placeholder

  return (
    <WidgetCard
      title="Hábitos"
      subtitle={
        habitos.length > 0
          ? `${habitos.length} hábito${habitos.length !== 1 ? "s" : ""} en seguimiento`
          : "Sin hábitos aún"
      }
      href="/habitos"
      icon={Activity}
      accent="secondary"
      footer={
        <>
          <span>Trackeo diario</span>
          <Link
            href="/habitos"
            className="inline-flex items-center gap-1 font-bold text-spruce transition-opacity hover:opacity-75"
          >
            Ver hábitos →
          </Link>
        </>
      }
    >
      {habitos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-outline-variant/70 bg-surface-bright px-4 py-8 text-center">
          <Activity size={22} className="text-spruce" />
          <p className="text-sm font-semibold text-heading">
            Sin hábitos todavía
          </p>
          <p className="text-xs text-on-surface-variant">
            Creá tu primer hábito desde el módulo de Hábitos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3 transition-colors duration-200 hover:bg-surface-container"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-success-container text-on-success-container">
                  Completado hoy
                </span>
                <h3 className="mt-1.5 text-sm font-bold text-charcoal">
                  {completadosHoy} de {habitos.length}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-charcoal">
                  Días de racha: {rachaMasLarga}
                </p>
              </div>
              <Flame size={20} className="shrink-0 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-on-surface-variant">
                Commits GitHub
              </span>
              <span className="text-xs font-bold tabular-nums text-charcoal">
                {totalCommits}
              </span>
            </div>
          </div>

          <Link
            href="/habitos"
            className="flex flex-col justify-between gap-3 rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3.5 transition-colors duration-200 hover:bg-surface-container"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-surface-container text-charcoal">
                  Ver detalle
                </span>
                <h3 className="mt-1.5 line-clamp-1 text-sm font-bold text-charcoal">
                  Abrir módulo de Hábitos
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-charcoal">
                  Heatmaps, rachas y actividad de GitHub
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-primary" />
            </div>
          </Link>
        </div>
      )}
    </WidgetCard>
  );
}
