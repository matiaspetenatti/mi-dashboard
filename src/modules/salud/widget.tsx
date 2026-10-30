import Link from "next/link";
import { Activity, HeartPulse, Pill } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearDuracion } from "./lib/fechas";
import { getSalud } from "./queries";

function Metrica({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-pebble">
        {etiqueta}
      </p>
      <p className="mt-0.5 text-xl font-bold tracking-tight text-heading">
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight text-on-surface-variant">
        {detalle}
      </p>
    </div>
  );
}

export function SaludWidgetSkeleton() {
  return (
    <WidgetCard
      title="Salud"
      subtitle="Cargando seguimiento"
      href="/salud"
      icon={HeartPulse}
      accent="secondary"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[86px] w-full rounded-[16px]" />
        <Skeleton className="h-[86px] w-full rounded-[16px]" />
        <Skeleton className="h-[86px] w-full rounded-[16px]" />
        <Skeleton className="h-[86px] w-full rounded-[16px]" />
      </div>
    </WidgetCard>
  );
}

export async function SaludWidget() {
  let data: Awaited<ReturnType<typeof getSalud>>;

  try {
    data = await getSalud();
  } catch {
    return (
      <WidgetCard
        title="Salud"
        subtitle="Seguimiento de migraña"
        href="/salud"
        icon={HeartPulse}
        accent="secondary"
      >
        <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
          <HeartPulse className="mx-auto h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-on-surface">
            No se pudo cargar Salud
          </p>
          <p className="text-xs text-on-surface-variant">
            Entrá al módulo para reintentar.
          </p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Salud"
      subtitle="Migraña y bienestar"
      href="/salud"
      icon={HeartPulse}
      accent="secondary"
      footer={
        <>
          <span>
            {data.totalEpisodios}{" "}
            {data.totalEpisodios === 1 ? "episodio" : "episodios"} registrados
          </span>
          <Link
            href="/salud"
            className="inline-flex items-center gap-1 font-bold text-primary transition-opacity hover:opacity-75"
          >
            Ver seguimiento →
          </Link>
        </>
      }
    >
      {data.totalEpisodios === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-outline-variant/70 bg-surface-bright px-4 py-8 text-center">
          <HeartPulse size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            Sin episodios registrados
          </p>
          <p className="text-xs text-on-surface-variant">
            Entrá a Salud para registrar tu primera crisis y tu diario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Metrica
            etiqueta="Episodios"
            valor={String(data.episodiosMes)}
            detalle="Este mes"
          />
          <Metrica
            etiqueta="Días libres"
            valor={String(data.diasLibres)}
            detalle={
              data.rachaLibre !== null && data.rachaLibre > 0
                ? `Racha de ${data.rachaLibre} días`
                : "Sin racha activa"
            }
          />
          <Metrica
            etiqueta="EVA promedio"
            valor={data.evaPromedio !== null ? `${data.evaPromedio}/10` : "—"}
            detalle={
              data.duracionPromedioMin !== null
                ? `Duración media ${formatearDuracion(
                    Math.round(data.duracionPromedioMin),
                  )}`
                : "Sin datos de este mes"
            }
          />
          <Metrica
            etiqueta="Tetralgin"
            valor={
              data.efectividadTetralgin !== null
                ? `${data.efectividadTetralgin}%`
                : "—"
            }
            detalle="Con alivio (90 días)"
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-on-surface-variant">
        {data.totalEpisodios === 0 ? (
          <>
            <Activity size={11} className="text-primary" />
            Empezá hoy con el registro diario
          </>
        ) : (
          <>
            <Pill size={11} className="text-primary" />
            {data.episodiosConAlivio} de {data.episodiosConTetralgin} episodios
            con respuesta al Tetralgin
          </>
        )}
      </div>
    </WidgetCard>
  );
}
