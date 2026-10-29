import Link from "next/link";
import { ArrowUpRight, CalendarClock, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  diasHasta,
  formatearFecha,
  formatNota,
  textoDias,
} from "@/lib/format";
import type { ResumenCarrera } from "../queries";
import {
  etiquetasEstadoCarrera,
  etiquetasTipoExamen,
  variantesEstadoCarrera,
} from "../constantes";
import { BarraProgreso } from "./barra-progreso";

export function TarjetaCarrera({
  resumen,
  hoy,
}: {
  resumen: ResumenCarrera;
  hoy: string;
}) {
  const { carrera, proximoExamen } = resumen;
  const anios =
    carrera.anioInicio && carrera.anioFin
      ? `${carrera.anioInicio}–${carrera.anioFin}`
      : carrera.anioInicio
        ? `Desde ${carrera.anioInicio}`
        : null;

  return (
    <Link
      href={`/estudio/carreras/${carrera.id}`}
      className="group flex flex-col gap-4 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-shadow duration-300 hover:shadow-elevation-2"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${carrera.color} 16%, transparent)`,
            color: `color-mix(in oklab, ${carrera.color} 72%, var(--color-on-surface))`,
          }}
        >
          <GraduationCap size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-on-surface">
              {carrera.nombre}
            </h3>
            <Badge variant={variantesEstadoCarrera[carrera.estado]}>
              {etiquetasEstadoCarrera[carrera.estado]}
            </Badge>
          </div>
          <p className="truncate text-xs text-on-surface-variant">
            {carrera.institucion ?? "Sin institución"}
            {anios && ` · ${anios}`}
          </p>
        </div>

        <ArrowUpRight
          size={16}
          className="mt-1 shrink-0 text-on-surface-variant/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">
            {resumen.aprobadas} de {resumen.totalPlan} materias aprobadas
          </span>
          <span
            className="font-semibold"
            style={{ color: carrera.color }}
          >
            {resumen.progreso}%
          </span>
        </div>
        <BarraProgreso valor={resumen.progreso} color={carrera.color} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface-container-low px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant">
            Promedio
          </p>
          <p className="mt-0.5 text-lg font-medium leading-none text-on-surface">
            {resumen.promedio !== null ? formatNota(resumen.promedio) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant">
            Regulares
          </p>
          <p className="mt-0.5 text-lg font-medium leading-none text-on-surface">
            {resumen.regulares}
          </p>
        </div>
      </div>

      {proximoExamen ? (
        <div className="flex items-center gap-2 rounded-2xl bg-tertiary-container/40 px-3 py-2 text-on-tertiary-container">
          <CalendarClock size={14} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {proximoExamen.materia} ·{" "}
              {etiquetasTipoExamen[proximoExamen.tipo]}
            </p>
            <p className="text-[10px] opacity-80">
              {formatearFecha(proximoExamen.fecha)} ·{" "}
              {textoDias(diasHasta(proximoExamen.fecha, hoy))}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-container-low px-3 py-2 text-[11px] text-on-surface-variant">
          Sin exámenes programados.
        </p>
      )}
    </Link>
  );
}
