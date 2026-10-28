"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Funnel, X } from "lucide-react";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import {
  etiquetasPrioridad,
  prioridades,
  type Prioridad,
} from "@/modules/tareas/constantes";
import {
  filtrosVencimiento,
  type FiltrosVista,
} from "@/modules/tareas/lib/config-vista";
import { contarFiltros } from "@/modules/tareas/lib/filtrar";
import { cn } from "cn";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";

const textosVencimiento: Record<(typeof filtrosVencimiento)[number], string> = {
  vencidas: "Vencidas",
  hoy: "Para hoy",
  semana: "Próximos 7 días",
  sin_fecha: "Sin fecha",
};

function Casilla({ activa }: { activa: boolean }) {
  return (
    <span
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded border text-transparent",
        activa
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant",
      )}
    >
      <Check size={11} strokeWidth={3} />
    </span>
  );
}

function Opcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-on-surface hover:bg-on-surface/5"
    >
      <Casilla activa={activa} />
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
      {children}
    </p>
  );
}

export function PanelFiltros({
  config,
  estados,
  etiquetas,
  onCambiar,
}: {
  config: ConfigVista;
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  onCambiar: (cambios: {
    filtros?: Partial<FiltrosVista>;
    mostrarCompletadas?: boolean;
  }) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const cantidad = contarFiltros(config);
  const { filtros } = config;

  function alternarLista<T>(lista: T[], valor: T) {
    return lista.includes(valor)
      ? lista.filter((item) => item !== valor)
      : [...lista, valor];
  }

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
          cantidad > 0
            ? "border-primary/40 bg-primary-container/50 text-on-primary-container"
            : "border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
        )}
      >
        <Funnel size={12} />
        Filtrar
        {cantidad > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-on-primary">
            {cantidad}
          </span>
        )}
        <ChevronDown size={12} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[95] outline-none"
        >
          <Popover.Popup className="max-h-[70dvh] w-72 origin-[var(--transform-origin)] overflow-y-auto rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 text-sm text-on-surface shadow-elevation-3 outline-none">
            <div className="flex items-center justify-between px-2 pt-1">
              <p className="text-xs font-semibold">Filtros</p>
              {cantidad > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onCambiar({
                      filtros: {
                        estados: [],
                        prioridades: [],
                        etiquetas: [],
                        vencimiento: null,
                        busqueda: filtros.busqueda,
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface"
                >
                  <X size={10} />
                  Limpiar
                </button>
              )}
            </div>

            {estados.length > 0 && (
              <>
                <TituloSeccion>Estado</TituloSeccion>
                {estados.map((estado) => (
                  <Opcion
                    key={estado.id}
                    activa={filtros.estados.includes(estado.id)}
                    onClick={() =>
                      onCambiar({
                        filtros: {
                          estados: alternarLista(filtros.estados, estado.id),
                        },
                      })
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: estado.color }}
                      />
                      {estado.nombre}
                    </span>
                  </Opcion>
                ))}
              </>
            )}

            <TituloSeccion>Prioridad</TituloSeccion>
            {prioridades.map((prioridad) => (
              <Opcion
                key={prioridad}
                activa={filtros.prioridades.includes(prioridad)}
                onClick={() =>
                  onCambiar({
                    filtros: {
                      prioridades: alternarLista<Prioridad>(
                        filtros.prioridades,
                        prioridad,
                      ),
                    },
                  })
                }
              >
                {etiquetasPrioridad[prioridad]}
              </Opcion>
            ))}

            <TituloSeccion>Vencimiento</TituloSeccion>
            {filtrosVencimiento.map((opcion) => (
              <Opcion
                key={opcion}
                activa={filtros.vencimiento === opcion}
                onClick={() =>
                  onCambiar({
                    filtros: {
                      vencimiento:
                        filtros.vencimiento === opcion ? null : opcion,
                    },
                  })
                }
              >
                {textosVencimiento[opcion]}
              </Opcion>
            ))}

            {etiquetas.length > 0 && (
              <>
                <TituloSeccion>Etiquetas</TituloSeccion>
                <div className="max-h-40 overflow-y-auto">
                  {etiquetas.map((etiqueta) => (
                    <Opcion
                      key={etiqueta.id}
                      activa={filtros.etiquetas.includes(etiqueta.id)}
                      onClick={() =>
                        onCambiar({
                          filtros: {
                            etiquetas: alternarLista(
                              filtros.etiquetas,
                              etiqueta.id,
                            ),
                          },
                        })
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: etiqueta.color }}
                        />
                        {etiqueta.nombre}
                      </span>
                    </Opcion>
                  ))}
                </div>
              </>
            )}

            <div className="my-1.5 h-px bg-outline-variant/50" />
            <Opcion
              activa={config.mostrarCompletadas}
              onClick={() =>
                onCambiar({ mostrarCompletadas: !config.mostrarCompletadas })
              }
            >
              Mostrar completadas y canceladas
            </Opcion>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
