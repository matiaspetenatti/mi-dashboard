"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export const CAMPO =
  "h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-heading placeholder:text-pebble transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50";

export const CAMPO_SELECT = cn(CAMPO, "cursor-pointer pr-8");

export const CAMPO_TEXTAREA =
  "min-h-24 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-sm text-heading placeholder:text-pebble transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function Campo({
  etiqueta,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        {etiqueta}
      </span>
      {children}
      {ayuda && <span className="text-[11px] text-pebble">{ayuda}</span>}
    </label>
  );
}

export function Chip({
  activo,
  onClick,
  children,
  disabled,
  className,
}: {
  activo?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50",
        activo
          ? "border-transparent bg-inverse-surface text-inverse-on-surface"
          : "border-outline-variant/60 bg-surface-container-lowest text-charcoal hover:border-outline hover:bg-surface-container-low",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GrupoChips({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

/** Etiqueta chica en mayúsculas para encabezar bloques. */
export function Etiqueta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold uppercase tracking-wider text-pebble",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Estado vacío consistente para las cinco vistas. */
export function Vacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-bright px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-surface-container text-primary">
        {icono}
      </span>
      <p className="text-sm font-bold text-heading">{titulo}</p>
      <p className="max-w-sm text-xs leading-relaxed text-on-surface-variant">
        {descripcion}
      </p>
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  );
}
