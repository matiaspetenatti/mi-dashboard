"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Loader2, Plus, Search, Tag } from "lucide-react";
import type { Etiqueta } from "@/modules/tareas/schema";
import { crearEtiqueta } from "@/modules/tareas/actions/etiquetas";
import { cn } from "cn";
import { EtiquetaChip } from "../chips";

export function SelectorEtiquetas({
  etiquetas,
  seleccionadas,
  onChange,
  className,
}: {
  etiquetas: Etiqueta[];
  seleccionadas: number[];
  onChange: (ids: number[]) => void;
  className?: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pendiente, startTransition] = useTransition();
  const activas = etiquetas.filter((etiqueta) =>
    seleccionadas.includes(etiqueta.id),
  );
  const texto = busqueda.trim().toLowerCase();
  const filtradas = etiquetas.filter((etiqueta) =>
    etiqueta.nombre.includes(texto),
  );
  const puedeCrear =
    texto.length > 0 &&
    !etiquetas.some((etiqueta) => etiqueta.nombre === texto);

  function alternar(id: number) {
    onChange(
      seleccionadas.includes(id)
        ? seleccionadas.filter((propia) => propia !== id)
        : [...seleccionadas, id],
    );
  }

  function crear() {
    if (!texto) return;
    startTransition(async () => {
      const resultado = await crearEtiqueta({ nombre: texto });
      if (resultado.ok) {
        onChange([...seleccionadas, resultado.id]);
        setBusqueda("");
        router.refresh();
      }
    });
  }

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label="Elegir etiquetas"
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-low",
          className,
        )}
      >
        {activas.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
            <Tag size={12} />
            Etiquetas
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1">
            {activas.slice(0, 2).map((etiqueta) => (
              <EtiquetaChip key={etiqueta.id} etiqueta={etiqueta} />
            ))}
            {activas.length > 2 && (
              <span className="text-[11px] text-on-surface-variant">
                +{activas.length - 2}
              </span>
            )}
          </span>
        )}
        <ChevronDown size={12} className="shrink-0 text-on-surface-variant" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[95] outline-none"
        >
          <Popover.Popup className="w-64 origin-[var(--transform-origin)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 text-sm text-on-surface shadow-elevation-3 outline-none">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar etiqueta..."
                className="h-8 w-full rounded-lg bg-surface-container-low pl-7.5 pr-2 text-xs outline-none placeholder:text-on-surface-variant/60 focus:bg-surface-container"
              />
            </div>

            <div className="mt-1.5 max-h-52 overflow-y-auto">
              {filtradas.length === 0 && !puedeCrear && (
                <p className="px-2 py-3 text-xs text-on-surface-variant">
                  {etiquetas.length === 0
                    ? "Todavía no hay etiquetas."
                    : "Sin resultados."}
                </p>
              )}
              {filtradas.map((etiqueta) => {
                const activa = seleccionadas.includes(etiqueta.id);
                return (
                  <button
                    key={etiqueta.id}
                    type="button"
                    onClick={() => alternar(etiqueta.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-on-surface/5"
                  >
                    <EtiquetaChip etiqueta={etiqueta} />
                    <span className="ml-auto grid size-4 place-items-center rounded border border-outline-variant text-transparent data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-on-primary" data-activa={activa}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            {puedeCrear && (
              <button
                type="button"
                disabled={pendiente}
                onClick={crear}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-outline-variant px-2 py-1.5 text-left text-xs text-primary hover:bg-primary/5 disabled:opacity-60"
              >
                {pendiente ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Crear “{texto}”
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
