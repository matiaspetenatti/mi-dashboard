"use client";

import { cn } from "cn";
import { iconoKeys, iconos } from "@/modules/tareas/iconos";

export function SelectorIcono({
  valor,
  onChange,
  className,
}: {
  valor: string;
  onChange: (icono: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {iconoKeys.map((clave) => {
        const Icono = iconos[clave];
        return (
          <button
            key={clave}
            type="button"
            aria-label={`Icono ${clave}`}
            title={clave}
            onClick={() => onChange(clave)}
            className={cn(
              "grid size-8 place-items-center rounded-xl border transition-colors hover:bg-on-surface/5",
              valor === clave
                ? "border-primary bg-primary-container text-on-primary-container"
                : "border-outline-variant/60 text-on-surface-variant",
            )}
          >
            <Icono size={15} />
          </button>
        );
      })}
    </div>
  );
}
