"use client";

import { Check, ChevronDown } from "lucide-react";
import type { EstadoProyecto } from "@/modules/tareas/schema";
import { cn } from "cn";
import { Menu, MenuItem, MenuSeparador, MenuVacio } from "../ui/menu";
import { PuntoEstado } from "../chips";

export function SelectorEstado({
  estados,
  valor,
  onChange,
  className,
  compacto = false,
}: {
  estados: EstadoProyecto[];
  valor: number | null;
  onChange: (estadoId: number) => void;
  className?: string;
  compacto?: boolean;
}) {
  const actual = estados.find((estado) => estado.id === valor) ?? null;

  return (
    <Menu
      ariaLabel="Elegir estado"
      trigger={
        <>
          {actual ? (
            <PuntoEstado estado={actual} />
          ) : (
            <span className="text-on-surface-variant">Estado</span>
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
      {estados.length === 0 ? (
        <MenuVacio>El proyecto no tiene estados.</MenuVacio>
      ) : (
        estados.map((estado) => (
          <MenuItem
            key={estado.id}
            onClick={() => onChange(estado.id)}
            activo={estado.id === valor}
          >
            <PuntoEstado estado={estado} className="flex-1" />
            {estado.id === valor && <Check size={13} />}
          </MenuItem>
        ))
      )}
      <MenuSeparador />
      <p className="px-2.5 pb-1 text-[10px] text-on-surface-variant/80">
        Se administran en los ajustes del proyecto.
      </p>
    </Menu>
  );
}
