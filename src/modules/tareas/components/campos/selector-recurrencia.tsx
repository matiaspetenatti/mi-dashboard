"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Repeat } from "lucide-react";
import {
  textoRecurrencia,
  unidadesRecurrencia,
  type UnidadRecurrencia,
} from "@/modules/tareas/constantes";
import { cn } from "cn";

const plurales: Record<UnidadRecurrencia, string> = {
  dia: "días",
  semana: "semanas",
  mes: "meses",
  anio: "años",
};

const nombres: Record<UnidadRecurrencia, string> = {
  dia: "Diaria",
  semana: "Semanal",
  mes: "Mensual",
  anio: "Anual",
};

export function SelectorRecurrencia({
  unidad,
  cada,
  onChange,
  className,
}: {
  unidad: UnidadRecurrencia | null;
  cada: number;
  onChange: (valor: { unidad: UnidadRecurrencia | null; cada: number }) => void;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label="Elegir recurrencia"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs hover:bg-surface-container-low",
          unidad ? "text-on-surface" : "text-on-surface-variant",
          className,
        )}
      >
        <Repeat size={12} />
        {unidad ? textoRecurrencia(unidad, cada) : "No se repite"}
        <ChevronDown size={12} className="text-on-surface-variant" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[95] outline-none"
        >
          <Popover.Popup className="w-60 origin-[var(--transform-origin)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-3 text-sm text-on-surface shadow-elevation-3 outline-none">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
              Frecuencia
              <select
                value={unidad ?? ""}
                onChange={(event) => {
                  const valor = event.target.value as UnidadRecurrencia | "";
                  onChange({
                    unidad: valor || null,
                    cada: valor ? Math.max(1, cada) : 1,
                  });
                }}
                className="mt-1 h-9 w-full rounded-lg border border-outline-variant/60 bg-surface-container-low px-2 text-xs outline-none focus:border-primary"
              >
                <option value="">No se repite</option>
                {unidadesRecurrencia.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {nombres[opcion]}
                  </option>
                ))}
              </select>
            </label>

            {unidad && (
              <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                <span>Cada</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={cada}
                  onChange={(event) =>
                    onChange({
                      unidad,
                      cada: Math.min(365, Math.max(1, Number(event.target.value) || 1)),
                    })
                  }
                  className="h-8 w-16 rounded-lg border border-outline-variant/60 bg-surface-container-low px-2 text-center text-xs text-on-surface outline-none focus:border-primary"
                />
                <span>{plurales[unidad]}</span>
              </div>
            )}

            <p className="mt-3 rounded-lg bg-surface-container-low px-2 py-1.5 text-[11px] leading-relaxed text-on-surface-variant">
              Al completarla se crea la siguiente ocurrencia.
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
