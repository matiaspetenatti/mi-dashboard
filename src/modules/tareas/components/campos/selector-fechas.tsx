"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { cn } from "cn";

function formatear(fecha: string | null) {
  if (!fecha) return null;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export function SelectorFechas({
  fechaInicio,
  fechaLimite,
  onChange,
  className,
}: {
  fechaInicio: string | null;
  fechaLimite: string | null;
  onChange: (cambios: {
    fechaInicio: string | null;
    fechaLimite: string | null;
  }) => void;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const inicio = formatear(fechaInicio);
  const limite = formatear(fechaLimite);
  const vencida =
    fechaLimite !== null &&
    fechaLimite < new Date().toISOString().slice(0, 10);

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label="Elegir fechas"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs hover:bg-surface-container-low",
          inicio || limite ? "text-on-surface" : "text-on-surface-variant",
          vencida && "border-error/40 bg-error-container/40 text-on-error-container",
          className,
        )}
      >
        <CalendarDays size={12} />
        {inicio && limite
          ? `${inicio} → ${limite}`
          : limite
            ? `Vence ${limite}`
            : inicio
              ? `Empieza ${inicio}`
              : "Fechas"}
        <ChevronDown size={12} className="text-on-surface-variant" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[95] outline-none"
        >
          <Popover.Popup className="w-64 origin-[var(--transform-origin)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-3 text-sm text-on-surface shadow-elevation-3 outline-none">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
              Inicio
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="date"
                  value={fechaInicio ?? ""}
                  onChange={(event) =>
                    onChange({
                      fechaInicio: event.target.value || null,
                      fechaLimite,
                    })
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border border-outline-variant/60 bg-surface-container-low px-2 text-xs outline-none focus:border-primary"
                />
                {fechaInicio && (
                  <button
                    type="button"
                    aria-label="Quitar fecha de inicio"
                    onClick={() =>
                      onChange({ fechaInicio: null, fechaLimite })
                    }
                    className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </label>

            <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
              Límite
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="date"
                  value={fechaLimite ?? ""}
                  min={fechaInicio ?? undefined}
                  onChange={(event) =>
                    onChange({
                      fechaInicio,
                      fechaLimite: event.target.value || null,
                    })
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border border-outline-variant/60 bg-surface-container-low px-2 text-xs outline-none focus:border-primary"
                />
                {fechaLimite && (
                  <button
                    type="button"
                    aria-label="Quitar fecha límite"
                    onClick={() =>
                      onChange({ fechaInicio, fechaLimite: null })
                    }
                    className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </label>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
