import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import {
  diasHasta,
  formatearFecha,
  formatNota,
  textoDias,
  textoDiasRelativo,
} from "@/lib/format";
import type { ExamenConContexto } from "../queries";
import {
  etiquetasEstadoExamen,
  etiquetasResultadoExamen,
  etiquetasTipoExamen,
  notasAprobado,
  variantesEstadoExamen,
  variantesResultadoExamen,
} from "../constantes";

export function FilaExamen({
  examen,
  hoy,
  mostrarCarrera = false,
  urgente = false,
  children,
}: {
  examen: ExamenConContexto;
  hoy: string;
  mostrarCarrera?: boolean;
  urgente?: boolean;
  children?: ReactNode;
}) {
  const dias = diasHasta(examen.fecha, hoy);
  const esUrgente =
    examen.estado === "programado" && dias >= 0 && dias <= 7;

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-surface-container-lowest p-3",
        urgente
          ? "border-warning/50"
          : "border-outline-variant/50",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          esUrgente
            ? "bg-warning-container text-on-warning-container"
            : "bg-tertiary-container/50 text-tertiary",
        )}
      >
        <CalendarDays size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-on-surface">
            {examen.materia}
          </p>
          <Badge variant="outline">{etiquetasTipoExamen[examen.tipo]}</Badge>
          {esUrgente && (
            <Badge variant="warning">{textoDias(dias)}</Badge>
          )}
          {examen.estado !== "programado" && (
            <Badge variant={variantesEstadoExamen[examen.estado]}>
              {etiquetasEstadoExamen[examen.estado]}
            </Badge>
          )}
        </div>

        {examen.titulo && (
          <p className="truncate text-xs text-on-surface-variant">
            {examen.titulo}
          </p>
        )}

        <p className="mt-0.5 text-[11px] text-on-surface-variant">
          {mostrarCarrera && `${examen.carrera} · `}
          {formatearFecha(examen.fecha)} · {textoDiasRelativo(dias)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {examen.nota !== null ? (
          <Badge
            variant={examen.nota >= notasAprobado ? "success" : "destructive"}
          >
            {formatNota(examen.nota)}
          </Badge>
        ) : examen.resultado !== null ? (
          <Badge variant={variantesResultadoExamen[examen.resultado]}>
            {etiquetasResultadoExamen[examen.resultado]}
          </Badge>
        ) : (
          <span className="text-[11px] text-on-surface-variant">
            Sin calificación
          </span>
        )}
        {children}
      </div>
    </li>
  );
}
