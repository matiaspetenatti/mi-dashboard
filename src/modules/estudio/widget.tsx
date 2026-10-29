import { GraduationCap } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { CountUp } from "@/components/motion/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import {
  diasHasta,
  formatearFecha,
  formatNota,
  textoDiasRelativo,
} from "@/lib/format";
import { etiquetasTipoExamen } from "./constantes";
import { getWidgetEstudio } from "./queries";
import { BarraProgreso } from "./components/barra-progreso";

export function EstudioWidgetSkeleton() {
  return (
    <WidgetCard
      title="Estudio"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
      </div>
    </WidgetCard>
  );
}

export async function EstudioWidget() {
  const { resumen, proximo, hoy } = await getWidgetEstudio();
  const dias = proximo ? Math.max(0, diasHasta(proximo.fecha, hoy)) : 0;

  return (
    <WidgetCard
      title="Estudio"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Avance general
          </p>
          <div className="mt-1 flex items-baseline gap-0.5">
            <CountUp
              value={resumen.progreso}
              className="text-4xl font-medium leading-none tracking-tight text-on-surface"
            />
            <span className="text-lg font-medium text-on-surface-variant">
              %
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-variant">
            {resumen.aprobadas} de {resumen.totalPlan} materias aprobadas
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Promedio
          </p>
          <p className="mt-1 text-2xl font-medium leading-none text-on-surface">
            {resumen.promedio !== null ? formatNota(resumen.promedio) : "—"}
          </p>
          <p className="mt-1 text-[10px] text-on-surface-variant">
            {resumen.carrerasActivas}{" "}
            {resumen.carrerasActivas === 1
              ? "carrera activa"
              : "carreras activas"}
          </p>
        </div>
      </div>

      <BarraProgreso valor={resumen.progreso} className="mt-3" />

      <div className="mt-auto pt-4">
        {proximo ? (
          <div className="rounded-2xl bg-tertiary-container/45 px-3 py-2.5 text-on-tertiary-container">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              Próximo examen
            </p>
            <p className="mt-0.5 truncate text-sm font-medium">
              {proximo.materia}
            </p>
            <p className="truncate text-[10px] opacity-80">
              {etiquetasTipoExamen[proximo.tipo]} ·{" "}
              {formatearFecha(proximo.fecha)} · {proximo.carrera}
            </p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <CountUp
                value={dias}
                className="text-xl font-medium leading-none"
              />
              <span className="text-[11px]">
                {dias === 0
                  ? "es hoy"
                  : dias === 1
                    ? "día restante"
                    : "días restantes"}
              </span>
              <span className="text-[10px] opacity-70">
                ({textoDiasRelativo(dias)})
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-tertiary-container/45 px-3 py-3 text-sm text-on-tertiary-container">
            Sin exámenes cargados por delante.
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
