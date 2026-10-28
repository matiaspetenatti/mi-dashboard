"use client";

import {
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Check,
  Copy,
  Loader2,
  MoveRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  EstadoProyecto,
  Etiqueta,
  Proyecto,
} from "@/modules/tareas/schema";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { Prioridad, UnidadRecurrencia } from "@/modules/tareas/constantes";
import {
  actualizarTarea,
  alternarCompletada,
  borrarTarea,
  crearSubtarea,
  duplicarTarea,
  moverTareaAProyecto,
} from "@/modules/tareas/actions/tareas";
import {
  destinoAlAlternar,
  type CambioTarea,
} from "@/modules/tareas/lib/optimista";
import { cn } from "cn";
import { Checkbox } from "./ui/checkbox";
import { Menu, MenuItem, MenuSeparador } from "./ui/menu";
import { Dialogo } from "@/components/ui/dialogo";
import { SelectorEstado } from "./campos/selector-estado";
import { SelectorPrioridad } from "./campos/selector-prioridad";
import { SelectorFechas } from "./campos/selector-fechas";
import { SelectorEtiquetas } from "./campos/selector-etiquetas";
import { SelectorRecurrencia } from "./campos/selector-recurrencia";

export type ProyectoConEstados = Pick<Proyecto, "id" | "nombre" | "color"> & {
  estados: EstadoProyecto[];
};

type PanelTareaProps = {
  tarea: TareaConDetalle | null;
  abierto: boolean;
  onCerrar: () => void;
  onAbrirTarea?: (id: number) => void;
  onAlternar?: (id: number) => void;
  onCambioLocal?: (id: number, cambio: CambioTarea) => void;
  onDescartarCambio?: (id: number) => void;
  onGuardado?: () => void;
  onRefrescar?: () => void;
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  proyectos?: ProyectoConEstados[];
};

export function PanelTarea({
  tarea,
  abierto,
  onCerrar,
  onAbrirTarea,
  onAlternar,
  onCambioLocal,
  onDescartarCambio,
  onGuardado,
  onRefrescar,
  estados,
  etiquetas,
  proyectos = [],
}: PanelTareaProps) {
  return (
    <Dialog.Root
      open={abierto && tarea !== null}
      onOpenChange={(valor) => {
        if (!valor) onCerrar();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-[81] flex h-dvh w-full max-w-[560px] flex-col overflow-hidden border-l border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-elevation-4 outline-none transition-transform duration-200 data-ending-style:translate-x-6 data-starting-style:translate-x-6">
          <Dialog.Title className="sr-only">Detalle de la tarea</Dialog.Title>
          {tarea && (
            <ContenidoPanel
              key={tarea.id}
              tarea={tarea}
              estados={estados}
              etiquetas={etiquetas}
              proyectos={proyectos}
              onCerrar={onCerrar}
              onAbrirTarea={onAbrirTarea}
              onAlternar={onAlternar}
              onCambioLocal={onCambioLocal}
              onDescartarCambio={onDescartarCambio}
              onGuardado={onGuardado}
              onRefrescar={onRefrescar}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
        {etiqueta}
      </p>
      {children}
    </div>
  );
}

function ContenidoPanel({
  tarea,
  estados,
  etiquetas,
  proyectos,
  onCerrar,
  onAbrirTarea,
  onAlternar,
  onCambioLocal,
  onDescartarCambio,
  onGuardado,
  onRefrescar,
}: {
  tarea: TareaConDetalle;
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  proyectos: ProyectoConEstados[];
  onCerrar: () => void;
  onAbrirTarea?: (id: number) => void;
  onAlternar?: (id: number) => void;
  onCambioLocal?: (id: number, cambio: CambioTarea) => void;
  onDescartarCambio?: (id: number) => void;
  onGuardado?: () => void;
  onRefrescar?: () => void;
}) {
  const [pendiente, startTransition] = useTransition();

  const [titulo, setTitulo] = useState(tarea.titulo);
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "");
  const [prioridad, setPrioridad] = useState<Prioridad | null>(tarea.prioridad);
  const [fechaInicio, setFechaInicio] = useState(tarea.fechaInicio);
  const [fechaLimite, setFechaLimite] = useState(tarea.fechaLimite);
  const [recurrencia, setRecurrencia] = useState<UnidadRecurrencia | null>(
    tarea.recurrencia,
  );
  const [recurrenciaCada, setRecurrenciaCada] = useState(tarea.recurrenciaCada);
  const [etiquetaIds, setEtiquetaIds] = useState(
    tarea.etiquetas.map((etiqueta) => etiqueta.id),
  );

  const [nuevaSubtarea, setNuevaSubtarea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [moviendo, setMoviendo] = useState(false);
  const [proyectoDestino, setProyectoDestino] = useState(
    proyectos.find((proyecto) => proyecto.id === tarea.proyectoId)?.id ??
      proyectos[0]?.id ??
      0,
  );
  const [estadoDestino, setEstadoDestino] = useState<number | null>(null);

  const completada = tarea.estado.categoria === "completado";
  const estadosDestino =
    proyectos.find((proyecto) => proyecto.id === proyectoDestino)?.estados ?? [];

  function ejecutar(
    accion: () => Promise<{ ok: boolean; error?: string }>,
    cambio?: CambioTarea,
  ) {
    setError(null);
    if (cambio) onCambioLocal?.(tarea.id, cambio);
    startTransition(async () => {
      const resultado = await accion();
      if (!resultado.ok) {
        if (cambio) onDescartarCambio?.(tarea.id);
        setError(resultado.error ?? "No se pudo guardar el cambio");
        return;
      }
      if (cambio) onGuardado?.();
    });
  }

  function alternarTarea() {
    if (onAlternar) {
      onAlternar(tarea.id);
      return;
    }

    const destino = destinoAlAlternar(estados, tarea);
    ejecutar(
      () => alternarCompletada(tarea.id),
      destino ? { estadoId: destino.id } : undefined,
    );
  }

  function guardarTitulo() {
    const limpio = titulo.trim();
    if (!limpio || limpio === tarea.titulo) {
      setTitulo(tarea.titulo);
      return;
    }
    ejecutar(() => actualizarTarea(tarea.id, { titulo: limpio }), {
      titulo: limpio,
    });
  }

  function guardarDescripcion() {
    const valor = descripcion.trim();
    if (valor === (tarea.descripcion ?? "")) return;
    ejecutar(() =>
      actualizarTarea(tarea.id, { descripcion: valor || null }),
    );
  }

  function ejecutarEstructural(
    accion: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const resultado = await accion();
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar el cambio");
        return;
      }
      onRefrescar?.();
    });
  }

  function agregarSubtarea() {
    const valor = nuevaSubtarea.trim();
    if (!valor) return;
    setNuevaSubtarea("");
    ejecutarEstructural(() => crearSubtarea(tarea.id, valor));
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-outline-variant/50 px-4 py-3">
        <span
          className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: `color-mix(in oklab, ${tarea.proyecto.color} 14%, transparent)`,
            color: `color-mix(in oklab, ${tarea.proyecto.color} 70%, var(--color-on-surface))`,
          }}
        >
          <span className="truncate">{tarea.proyecto.nombre}</span>
        </span>
        <span className="text-xs font-medium text-on-surface-variant">
          {tarea.proyecto.prefijo}-{tarea.id}
        </span>
        {pendiente && (
          <Loader2
            size={13}
            className="animate-spin text-on-surface-variant"
            aria-label="Guardando"
          />
        )}
        <div className="ml-auto flex items-center gap-1">
          <Menu
            ariaLabel="Más acciones"
            align="end"
            trigger={<span className="px-2 py-1 text-lg leading-none">···</span>}
            triggerClassName="rounded-full text-on-surface-variant hover:bg-on-surface/5"
          >
            <MenuItem
              onClick={() =>
                ejecutarEstructural(async () => {
                  const resultado = await duplicarTarea(tarea.id);
                  if (resultado.ok) onAbrirTarea?.(resultado.id);
                  return resultado;
                })
              }
            >
              <Copy size={14} />
              Duplicar tarea
            </MenuItem>
            {proyectos.length > 1 && (
              <MenuItem
                onClick={() => {
                  const destino =
                    proyectos.find(
                      (proyecto) => proyecto.id !== tarea.proyectoId,
                    ) ?? proyectos[0];
                  setProyectoDestino(destino?.id ?? 0);
                  setEstadoDestino(destino?.estados[0]?.id ?? null);
                  setMoviendo(true);
                }}
              >
                <MoveRight size={14} />
                Mover a otro proyecto
              </MenuItem>
            )}
            <MenuSeparador />
            <MenuItem peligro onClick={() => setConfirmando(true)}>
              <Trash2 size={14} />
              Eliminar tarea
            </MenuItem>
          </Menu>
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={onCerrar}
            className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/5"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {error && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={completada}
            ariaLabel={completada ? "Marcar como pendiente" : "Marcar como hecha"}
            onChange={alternarTarea}
            className="mt-1.5"
          />
          <textarea
            value={titulo}
            rows={2}
            onChange={(event) => setTitulo(event.target.value)}
            onBlur={guardarTitulo}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                guardarTitulo();
                (event.target as HTMLTextAreaElement).blur();
              }
            }}
            className={cn(
              "min-h-0 flex-1 resize-none rounded-lg bg-transparent px-1 py-0.5 text-lg font-semibold leading-snug outline-none focus:bg-surface-container-low",
              completada && "text-on-surface-variant line-through",
            )}
            aria-label="Título de la tarea"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <SelectorEstado
            estados={estados}
            valor={tarea.estadoId}
            onChange={(valor) => {
              ejecutar(() => actualizarTarea(tarea.id, { estadoId: valor }), {
                estadoId: valor,
              });
            }}
          />
          <SelectorPrioridad
            valor={prioridad}
            onChange={(valor) => {
              setPrioridad(valor);
              ejecutar(() => actualizarTarea(tarea.id, { prioridad: valor }), {
                prioridad: valor,
              });
            }}
          />
          <SelectorFechas
            fechaInicio={fechaInicio}
            fechaLimite={fechaLimite}
            onChange={(valor) => {
              setFechaInicio(valor.fechaInicio);
              setFechaLimite(valor.fechaLimite);
              ejecutar(() => actualizarTarea(tarea.id, valor), {
                fechaInicio: valor.fechaInicio,
                fechaLimite: valor.fechaLimite,
              });
            }}
          />
          <SelectorRecurrencia
            unidad={recurrencia}
            cada={recurrenciaCada}
            onChange={(valor) => {
              setRecurrencia(valor.unidad);
              setRecurrenciaCada(valor.cada);
              ejecutar(
                () =>
                  actualizarTarea(tarea.id, {
                    recurrencia: valor.unidad,
                    recurrenciaCada: valor.cada,
                  }),
                {
                  recurrencia: valor.unidad,
                  recurrenciaCada: valor.cada,
                },
              );
            }}
          />
          <SelectorEtiquetas
            etiquetas={etiquetas}
            seleccionadas={etiquetaIds}
            onChange={(ids) => {
              setEtiquetaIds(ids);
              ejecutar(() => actualizarTarea(tarea.id, { etiquetaIds: ids }), {
                etiquetaIds: ids,
              });
            }}
          />
        </div>

        <Campo etiqueta="Descripción">
          <textarea
            value={descripcion}
            rows={5}
            placeholder="Agregá una descripción en texto plano..."
            onChange={(event) => setDescripcion(event.target.value)}
            onBlur={guardarDescripcion}
            className="w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container-low/60 px-3 py-2.5 text-sm leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface-container-lowest"
          />
        </Campo>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
              Subtareas
            </p>
            {tarea.subtareas.length > 0 && (
              <span className="text-[11px] text-on-surface-variant">
                {tarea.subtareasCompletadas}/{tarea.subtareas.length}
              </span>
            )}
          </div>

          <ul className="space-y-1">
            {tarea.subtareas.map((subtarea) => {
              const hecha = subtarea.estado.categoria === "completado";
              return (
                <li
                  key={subtarea.id}
                  className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-container-low/70"
                >
                  <Checkbox
                    checked={hecha}
                    ariaLabel="Completar subtarea"
                    onChange={() => {
                      if (onAlternar) onAlternar(subtarea.id);
                      else ejecutar(() => alternarCompletada(subtarea.id));
                    }}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      hecha && "text-on-surface-variant line-through",
                    )}
                  >
                    {subtarea.titulo}
                  </span>
                  <button
                    type="button"
                    aria-label="Eliminar subtarea"
                    onClick={() => {
                      ejecutarEstructural(() => borrarTarea(subtarea.id));
                    }}
                    className="grid size-6 place-items-center rounded-full text-on-surface-variant/60 opacity-0 transition-opacity hover:bg-on-surface/5 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-1.5 flex items-center gap-2 rounded-lg px-1">
            <Plus size={14} className="shrink-0 text-on-surface-variant" />
            <input
              value={nuevaSubtarea}
              onChange={(event) => setNuevaSubtarea(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  agregarSubtarea();
                }
              }}
              placeholder="Agregar subtarea y presionar Enter"
              className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-low/60 px-3 py-2.5 text-[11px] leading-relaxed text-on-surface-variant">
          <p>
            Creada el{" "}
            {new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(
              new Date(`${tarea.creadaEn.replace(" ", "T")}Z`),
            )}
            {tarea.actualizadaEn
              ? ` · Editada el ${new Intl.DateTimeFormat("es-AR", {
                  timeZone: "UTC",
                }).format(
                  new Date(`${tarea.actualizadaEn.replace(" ", "T")}Z`),
                )}`
              : ""}
          </p>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-outline-variant/50 px-4 py-3">
        {confirmando ? (
          <>
            <p className="text-xs text-on-surface-variant">
              ¿Eliminar la tarea y sus subtareas?
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-full px-3 py-1.5 text-xs text-on-surface-variant hover:bg-on-surface/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => {
                  startTransition(async () => {
                    const resultado = await borrarTarea(tarea.id);
                    if (!resultado.ok) {
                      setError(resultado.error ?? "No se pudo eliminar");
                      return;
                    }
                    onCerrar();
                    onRefrescar?.();
                  });
                }}
                className="rounded-full bg-error-container px-3 py-1.5 text-xs font-medium text-on-error-container disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={alternarTarea}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                completada
                  ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  : "bg-primary-container text-on-primary-container hover:bg-primary-container/80",
              )}
            >
              <Check size={13} />
              {completada ? "Reabrir tarea" : "Marcar como hecha"}
            </button>
            <p className="text-[11px] text-on-surface-variant">
              Los cambios se guardan automáticamente.
            </p>
          </>
        )}
      </footer>

      <Dialogo
        abierto={moviendo}
        onOpenChange={setMoviendo}
        titulo="Mover tarea"
        descripcion="Elegí el proyecto y el estado de destino."
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-on-surface-variant">
            Proyecto
            <select
              value={proyectoDestino}
              onChange={(event) => {
                const id = Number(event.target.value);
                setProyectoDestino(id);
                const proyecto = proyectos.find((item) => item.id === id);
                setEstadoDestino(proyecto?.estados[0]?.id ?? null);
              }}
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            >
              {proyectos
                .filter((proyecto) => proyecto.id !== tarea.proyectoId)
                .map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-on-surface-variant">
            Estado
            <select
              value={estadoDestino ?? ""}
              onChange={(event) => setEstadoDestino(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            >
              {estadosDestino.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMoviendo(false)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!estadoDestino || pendiente}
              onClick={() => {
                if (!estadoDestino) return;
                startTransition(async () => {
                  const resultado = await moverTareaAProyecto(
                    tarea.id,
                    proyectoDestino,
                    estadoDestino,
                  );
                  if (!resultado.ok) {
                    setError(resultado.error ?? "No se pudo mover");
                    return;
                  }
                  setMoviendo(false);
                  onCerrar();
                  onRefrescar?.();
                });
              }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              Mover
            </button>
          </div>
        </div>
      </Dialogo>
    </>
  );
}
