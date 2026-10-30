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
  className,
  disabled,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
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
