import { BellRing, GraduationCap } from "lucide-react";
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
      subtitle="Progreso universitario"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-28 w-full rounded-[16px]" />
      </div>
    </WidgetCard>
  );
}

export async function EstudioWidget() {
  let widget: Awaited<ReturnType<typeof getWidgetEstudio>>;

  try {
    widget = await getWidgetEstudio();
  } catch {
    return <EstudioWidgetError />;
  }

  const { resumen, proximo, hoy } = widget;
  const dias = proximo ? Math.max(0, diasHasta(proximo.fecha, hoy)) : 0;
  const restantes =
    dias === 0
      ? "es hoy"
      : dias === 1
        ? "1 día restante"
        : `${dias} días restantes`;

  return (
    <WidgetCard
      title="Estudio"
      subtitle="Progreso universitario"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
      footer={
        <>
          <span>{resumen.totalMaterias} materias cargadas</span>
          <span>
            {proximo ? `(${textoDiasRelativo(dias)})` : "Sin exámenes"}
          </span>
        </>
      }
    >
      <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
        <p className="font-semibold uppercase tracking-wider">
          Avance general:{" "}
          <CountUp
            value={resumen.progreso}
            className="font-bold text-heading"
          />
          %
        </p>
        <p className="shrink-0">
          {resumen.aprobadas} de {resumen.totalPlan} materias
        </p>
      </div>

      <BarraProgreso
        valor={resumen.progreso}
        color="var(--primary)"
        className="mt-2 h-2.5"
      />

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
        <p>
          Promedio:{" "}
          <span className="font-bold text-heading">
            {resumen.promedio !== null ? formatNota(resumen.promedio) : "—"}
          </span>
        </p>
        <p className="shrink-0">
          {resumen.carrerasActivas}{" "}
          {resumen.carrerasActivas === 1 ? "carrera activa" : "carreras activas"}
        </p>
      </div>

      <div className="mt-4 rounded-[16px] border border-outline-variant/60 bg-surface-container p-3.5">
        {proximo ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Próximo examen: {restantes}
              </p>
              <BellRing
                size={14}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-1 truncate text-sm font-bold text-heading">
              {proximo.materia}
            </h3>
            <p className="mt-0.5 truncate text-xs text-charcoal">
              {etiquetasTipoExamen[proximo.tipo]} ·{" "}
              {formatearFecha(proximo.fecha)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
              {proximo.carrera}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2 text-center">
            <BellRing
              size={18}
              className="text-on-surface-variant opacity-60"
            />
            <p className="text-sm font-medium text-heading">
              Sin exámenes por delante
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Cuando cargues uno, aparece acá.
            </p>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export function EstudioWidgetError() {
  return (
    <WidgetCard
      title="Estudio"
      subtitle="Progreso universitario"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
        <GraduationCap className="mx-auto h-6 w-6 text-on-surface-variant opacity-60" />
        <p className="text-sm font-medium text-on-surface">
          No se pudo cargar el avance de estudio
        </p>
        <p className="text-xs text-on-surface-variant">
          Entrá al módulo de Estudio para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}
