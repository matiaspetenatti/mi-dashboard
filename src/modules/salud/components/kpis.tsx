import {
  Activity,
  CalendarCheck,
  Gauge,
  Minus,
  Pill,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatearDuracion } from "../lib/fechas";
import { nivelDolor } from "../constantes";
import type { ResumenSalud } from "../queries";

function Tendencia({
  valor,
  texto,
}: {
  valor: number;
  texto: string;
}) {
  const Icono = valor < 0 ? TrendingDown : valor > 0 ? TrendingUp : Minus;
  const color =
    valor < 0
      ? "text-success"
      : valor > 0
        ? "text-error"
        : "text-on-surface-variant";

  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
      <Icono size={14} /> {texto}
    </span>
  );
}

export function SaludKpis({ data }: { data: ResumenSalud }) {
  const deltaEpisodios = data.episodiosMes - data.episodiosMesAnterior;
  const textoDelta =
    data.episodiosMesAnterior === 0
      ? data.episodiosMes === 0
        ? "Sin episodios este mes"
        : "Primer mes con registros"
      : `${deltaEpisodios > 0 ? "+" : ""}${deltaEpisodios} vs. mes anterior`;

  const nivel =
    data.evaPromedio !== null
      ? nivelDolor(Math.round(data.evaPromedio))
      : null;

  return (
    <section
      aria-label="Indicadores de migraña"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
    >
      {/* Días libres */}
      <article className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-primary-container/60"
        />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-xs font-medium text-on-surface-variant">
            Días libres de migraña
          </span>
          <Badge variant="success" className="shrink-0 self-start">
            <CalendarCheck /> {data.diasTranscurridos} días
          </Badge>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-heading">
          {data.diasLibres}
          <span className="ml-1 text-sm font-medium text-on-surface-variant">
            {data.diasLibres === 1 ? "día" : "días"}
          </span>
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <Activity size={14} className="text-secondary" />
          {data.rachaLibre === null
            ? "Sin registros todavía"
            : data.rachaLibre === 0
              ? "Hoy hay un episodio registrado"
              : `Racha de ${data.rachaLibre} ${
                  data.rachaLibre === 1 ? "día" : "días"
                } sin crisis`}
        </div>
      </article>

      {/* Episodios del mes */}
      <article className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-xs font-medium text-on-surface-variant">
            Episodios este mes
          </span>
          <Badge variant="outline" className="shrink-0 self-start">
            Mes en curso
          </Badge>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-heading">
          {data.episodiosMes}
          <span className="ml-1 text-sm font-medium text-on-surface-variant">
            {data.episodiosMes === 1 ? "crisis" : "crisis"}
          </span>
        </p>
        <div className="mt-3">
          <Tendencia valor={deltaEpisodios} texto={textoDelta} />
        </div>
      </article>

      {/* Intensidad promedio */}
      <article className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-xs font-medium text-on-surface-variant">
            Intensidad promedio (EVA)
          </span>
          <Badge
            variant={nivel ? "warning" : "outline"}
            className="shrink-0 self-start"
          >
            {nivel?.label ?? "Sin datos"}
          </Badge>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-heading">
          {data.evaPromedio !== null ? data.evaPromedio : "—"}
          <span className="ml-1 text-sm font-medium text-on-surface-variant">
            / 10
          </span>
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <Gauge size={14} className="text-secondary" />
          {data.duracionPromedioMin !== null
            ? `Duración media: ${formatearDuracion(
                Math.round(data.duracionPromedioMin),
              )}`
            : "Sin episodios cerrados este mes"}
        </div>
      </article>

      {/* Efectividad Tetralgin */}
      <article className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-xs font-medium text-on-surface-variant">
            Efectividad de Tetralgin
          </span>
          <Badge variant="outline" className="shrink-0 self-start">
            Últimos 90 días
          </Badge>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-heading">
          {data.efectividadTetralgin !== null
            ? `${data.efectividadTetralgin}%`
            : "—"}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <Pill size={14} className="text-secondary" />
          {data.efectividadTetralgin !== null
            ? `${data.episodiosConAlivio} de ${data.episodiosConTetralgin} con alivio`
            : "Sin respuestas registradas"}
        </div>
      </article>
    </section>
  );
}
