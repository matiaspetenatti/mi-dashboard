"use client";

import { Check, ChevronDown, Minus } from "lucide-react";
import { etiquetasPrioridad, prioridades, type Prioridad } from "@/modules/tareas/constantes";
import { cn } from "cn";
import { Menu, MenuItem } from "../ui/menu";
import { PrioridadChip } from "../chips";

export function SelectorPrioridad({
  valor,
  onChange,
  className,
  compacto = false,
}: {
  valor: Prioridad | null;
  onChange: (prioridad: Prioridad | null) => void;
  className?: string;
  compacto?: boolean;
}) {
  return (
    <Menu
      ariaLabel="Elegir prioridad"
      trigger={
        <>
          {valor ? (
            <PrioridadChip prioridad={valor} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
              <Minus size={12} />
              Prioridad
            </span>
          )}
          <ChevronDown size={12} className="text-on-surface-variant" />
        </>
      }
      triggerClassName={cn(
        compacto
          ? "rounded-lg px-1.5 py-1 text-xs hover:bg-on-surface/5"
          : "rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-low",
        className,
      )}
    >
      {prioridades.map((prioridad) => (
        <MenuItem
          key={prioridad}
          onClick={() => onChange(prioridad)}
          activo={prioridad === valor}
        >
          <PrioridadChip prioridad={prioridad} className="flex-1" />
          {prioridad === valor && <Check size={13} />}
        </MenuItem>
      ))}
      <MenuItem onClick={() => onChange(null)} activo={valor === null}>
        <span className="flex-1 text-on-surface-variant">Sin prioridad</span>
        {valor === null && <Check size={13} />}
      </MenuItem>
      <p className="sr-only">{Object.values(etiquetasPrioridad).join(", ")}</p>
    </Menu>
  );
}
