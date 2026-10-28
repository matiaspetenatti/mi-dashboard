import { createElement } from "react";
import type { EstadoProyecto, Etiqueta, Prioridad } from "@/modules/tareas/schema";
import { etiquetasPrioridad } from "@/modules/tareas/constantes";
import { iconoDe } from "@/modules/tareas/iconos";
import { cn } from "cn";

export function EtiquetaChip({
  etiqueta,
  className,
  onClick,
  activa,
}: {
  etiqueta: Pick<Etiqueta, "nombre" | "color" | "icono">;
  className?: string;
  onClick?: () => void;
  activa?: boolean;
}) {
  const Icono = etiqueta.icono ? iconoDe(etiqueta.icono, "tag") : null;
  const contenido = (
    <>
      {Icono && createElement(Icono, { size: 11 })}
      {etiqueta.nombre}
    </>
  );

  const estilos = cn(
    "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
    activa && "ring-2 ring-primary/40 ring-offset-1 ring-offset-surface-container-lowest",
    onClick && "transition-transform hover:scale-[1.03]",
    className,
  );

  const style = {
    backgroundColor: `color-mix(in oklab, ${etiqueta.color} 16%, transparent)`,
    color: `color-mix(in oklab, ${etiqueta.color} 72%, var(--color-on-surface))`,
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={estilos} style={style}>
        {contenido}
      </button>
    );
  }

  return (
    <span className={estilos} style={style}>
      {contenido}
    </span>
  );
}

const coloresPrioridad: Record<Prioridad, string> = {
  urgente: "#dc2626",
  alta: "#f97316",
  media: "#3b82f6",
  baja: "#737373",
};

export function PrioridadChip({
  prioridad,
  conTexto = true,
  className,
}: {
  prioridad: Prioridad;
  conTexto?: boolean;
  className?: string;
}) {
  const color = coloresPrioridad[prioridad];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
        color: `color-mix(in oklab, ${color} 70%, var(--color-on-surface))`,
      }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {conTexto ? etiquetasPrioridad[prioridad] : null}
    </span>
  );
}

export function PuntoEstado({
  estado,
  className,
}: {
  estado: Pick<EstadoProyecto, "color" | "nombre">;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: estado.color }}
      />
      <span className="truncate">{estado.nombre}</span>
    </span>
  );
}

export function EstadoChip({
  estado,
  className,
}: {
  estado: Pick<EstadoProyecto, "color" | "nombre">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${estado.color} 15%, transparent)`,
        color: `color-mix(in oklab, ${estado.color} 70%, var(--color-on-surface))`,
      }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ backgroundColor: estado.color }}
      />
      {estado.nombre}
    </span>
  );
}
