"use client";

import { createElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Archive,
  ArchiveRestore,
  Check,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import type {
  EstadoProyecto,
  Proyecto,
} from "@/modules/tareas/schema";
import type { VistaConConfig } from "@/modules/tareas/queries/proyectos";
import {
  categoriasEstado,
  etiquetasCategoria,
  etiquetasTipoVista,
  paleta,
  type CategoriaEstado,
} from "@/modules/tareas/constantes";
import {
  actualizarEstado,
  crearEstado,
  eliminarEstado,
  reordenarEstados,
} from "@/modules/tareas/actions/estados";
import {
  archivarProyecto,
  borrarProyecto,
} from "@/modules/tareas/actions/proyectos";
import {
  borrarVista,
  marcarVistaPredeterminada,
} from "@/modules/tareas/actions/vistas";
import { Dialogo } from "@/components/ui/dialogo";
import { DialogoProyecto } from "./dialogo-proyecto";
import { SelectorColor } from "./ui/selector-color";
import { iconoDe } from "@/modules/tareas/iconos";
import { iconosVista } from "./vistas-tabs";

function Seccion({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">{titulo}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{descripcion}</p>
        </div>
        {accion}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AjustesProyecto({
  proyecto,
  estados,
  vistas,
}: {
  proyecto: Proyecto;
  estados: EstadoProyecto[];
  vistas: VistaConConfig[];
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [editandoProyecto, setEditandoProyecto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estadoEditando, setEstadoEditando] = useState<EstadoProyecto | null>(
    null,
  );
  const [creandoEstado, setCreandoEstado] = useState(false);
  const [nombreEstado, setNombreEstado] = useState("");
  const [colorEstado, setColorEstado] = useState<string>(paleta[0]);
  const [categoriaEstado, setCategoriaEstado] =
    useState<CategoriaEstado>("pendiente");

  const [estadoAEliminar, setEstadoAEliminar] =
    useState<EstadoProyecto | null>(null);
  const [destinoEliminar, setDestinoEliminar] = useState<number | null>(null);
  const [eliminandoProyecto, setEliminandoProyecto] = useState(false);

  const Icono = iconoDe(proyecto.icono, "proyecto");

  function abrirEstado(estado: EstadoProyecto | null) {
    setError(null);
    setEstadoEditando(estado);
    setCreandoEstado(estado === null);
    setNombreEstado(estado?.nombre ?? "");
    setColorEstado(estado?.color ?? paleta[0]);
    setCategoriaEstado(estado?.categoria ?? "pendiente");
  }

  function guardarEstado() {
    const nombre = nombreEstado.trim();
    if (!nombre) return;
    startTransition(async () => {
      const datos = { nombre, color: colorEstado, categoria: categoriaEstado };
      const resultado = estadoEditando
        ? await actualizarEstado(estadoEditando.id, datos)
        : await crearEstado(proyecto.id, datos);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar el estado");
        return;
      }
      setEstadoEditando(null);
      setCreandoEstado(false);
      router.refresh();
    });
  }

  function moverEstado(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= estados.length) return;
    const ids = estados.map((estado) => estado.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    startTransition(async () => {
      await reordenarEstados(proyecto.id, ids);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 flex-1 space-y-5">
      <header>
        <Link
          href={`/tareas/proyectos/${proyecto.slug}`}
          className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={11} />
          Volver al proyecto
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-2xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${proyecto.color} 18%, transparent)`,
              color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
            }}
          >
            {createElement(Icono, { size: 20 })}
          </span>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-on-surface">
              Ajustes de {proyecto.nombre}
            </h1>
            <p className="text-xs text-on-surface-variant">
              Estados, vistas y configuración general del proyecto.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
          {error}
        </p>
      )}

      <Seccion
        titulo="General"
        descripcion="Nombre, descripción, color, ícono y prefijo de ID."
        accion={
          <button
            type="button"
            onClick={() => setEditandoProyecto(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low"
          >
            <Pencil size={12} />
            Editar
          </button>
        }
      >
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl bg-surface-container-low px-3 py-2">
            <dt className="text-on-surface-variant">Prefijo</dt>
            <dd className="mt-0.5 font-semibold tracking-wider text-on-surface">
              {proyecto.prefijo}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-container-low px-3 py-2">
            <dt className="text-on-surface-variant">Slug</dt>
            <dd className="mt-0.5 truncate font-medium text-on-surface">
              {proyecto.slug}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-container-low px-3 py-2">
            <dt className="text-on-surface-variant">Estado</dt>
            <dd className="mt-0.5 font-medium text-on-surface">
              {proyecto.archivado ? "Archivado" : "Activo"}
            </dd>
          </div>
        </dl>
      </Seccion>

      <Seccion
        titulo="Estados"
        descripcion="Cada estado pertenece a una categoría que define cómo se cuenta."
        accion={
          <button
            type="button"
            onClick={() => abrirEstado(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary"
          >
            <Plus size={12} />
            Nuevo estado
          </button>
        }
      >
        <ul className="space-y-1">
          {estados.map((estado, indice) => (
            <li
              key={estado.id}
              className="group flex items-center gap-2 rounded-xl border border-outline-variant/40 px-2.5 py-2"
            >
              <span className="flex flex-col">
                <button
                  type="button"
                  aria-label="Subir estado"
                  disabled={indice === 0 || pendiente}
                  onClick={() => moverEstado(indice, -1)}
                  className="text-on-surface-variant/60 hover:text-on-surface disabled:opacity-30"
                >
                  <ArrowUp size={11} />
                </button>
                <button
                  type="button"
                  aria-label="Bajar estado"
                  disabled={indice === estados.length - 1 || pendiente}
                  onClick={() => moverEstado(indice, 1)}
                  className="text-on-surface-variant/60 hover:text-on-surface disabled:opacity-30"
                >
                  <ArrowDown size={11} />
                </button>
              </span>
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: estado.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-on-surface">
                {estado.nombre}
              </span>
              <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] text-on-surface-variant">
                {etiquetasCategoria[estado.categoria]}
              </span>
              <button
                type="button"
                aria-label="Editar estado"
                onClick={() => abrirEstado(estado)}
                className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                aria-label="Eliminar estado"
                disabled={estados.length <= 1}
                onClick={() => {
                  setError(null);
                  setEstadoAEliminar(estado);
                  setDestinoEliminar(
                    estados.find((otro) => otro.id !== estado.id)?.id ?? null,
                  );
                }}
                className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-error disabled:opacity-30"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion
        titulo="Vistas"
        descripcion="Las vistas guardan filtros, agrupación y columnas."
      >
        <ul className="space-y-1">
          {vistas.map((vista) => {
            const IconoVista = iconosVista[vista.tipo];
            return (
              <li
                key={vista.id}
                className="flex items-center gap-2 rounded-xl border border-outline-variant/40 px-2.5 py-2"
              >
                <IconoVista size={13} className="text-on-surface-variant" />
                <span className="min-w-0 flex-1 truncate text-sm text-on-surface">
                  {vista.nombre}
                </span>
                <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] text-on-surface-variant">
                  {etiquetasTipoVista[vista.tipo]}
                </span>
                <button
                  type="button"
                  aria-label="Marcar como predeterminada"
                  onClick={() => {
                    startTransition(async () => {
                      await marcarVistaPredeterminada(vista.id);
                      router.refresh();
                    });
                  }}
                  className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
                >
                  {vista.predeterminada ? (
                    <Star size={12} className="text-primary" />
                  ) : (
                    <Star size={12} />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Eliminar vista"
                  disabled={vistas.length <= 1}
                  onClick={() => {
                    startTransition(async () => {
                      const resultado = await borrarVista(vista.id);
                      if (!resultado.ok) {
                        setError(resultado.error ?? "No se pudo eliminar");
                        return;
                      }
                      router.refresh();
                    });
                  }}
                  className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-error disabled:opacity-30"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      </Seccion>

      <Seccion
        titulo="Zona sensible"
        descripcion="Archivar oculta el proyecto de la navegación; borrar elimina todo su contenido."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              startTransition(async () => {
                const resultado = await archivarProyecto(
                  proyecto.id,
                  !proyecto.archivado,
                );
                if (!resultado.ok) {
                  setError(resultado.error ?? "No se pudo archivar");
                  return;
                }
                router.refresh();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low"
          >
            {proyecto.archivado ? (
              <ArchiveRestore size={12} />
            ) : (
              <Archive size={12} />
            )}
            {proyecto.archivado ? "Desarchivar" : "Archivar proyecto"}
          </button>
          <button
            type="button"
            onClick={() => setEliminandoProyecto(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1.5 text-xs font-medium text-on-error-container"
          >
            <Trash2 size={12} />
            Eliminar proyecto
          </button>
        </div>
      </Seccion>

      {editandoProyecto && (
        <DialogoProyecto
          abierto={editandoProyecto}
          onOpenChange={setEditandoProyecto}
          proyecto={proyecto}
        />
      )}

      <Dialogo
        abierto={creandoEstado || estadoEditando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setCreandoEstado(false);
            setEstadoEditando(null);
          }
        }}
        titulo={estadoEditando ? "Editar estado" : "Nuevo estado"}
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-on-surface-variant">
            Nombre
            <input
              autoFocus
              value={nombreEstado}
              onChange={(event) => setNombreEstado(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-on-surface-variant">
            Categoría
            <select
              value={categoriaEstado}
              onChange={(event) =>
                setCategoriaEstado(event.target.value as CategoriaEstado)
              }
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            >
              {categoriasEstado.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {etiquetasCategoria[categoria]}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-1.5 text-xs font-medium text-on-surface-variant">
              Color
            </p>
            <SelectorColor valor={colorEstado} onChange={setColorEstado} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCreandoEstado(false);
                setEstadoEditando(null);
              }}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente || !nombreEstado.trim()}
              onClick={guardarEstado}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              {pendiente && <Loader2 size={13} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={estadoAEliminar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEstadoAEliminar(null);
        }}
        titulo="Eliminar estado"
        descripcion="Las tareas que estaban en este estado se moverán al destino elegido."
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-on-surface-variant">
            Mover tareas a
            <select
              value={destinoEliminar ?? ""}
              onChange={(event) => setDestinoEliminar(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            >
              {estados
                .filter((estado) => estado.id !== estadoAEliminar?.id)
                .map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
            </select>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEstadoAEliminar(null)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente || !destinoEliminar}
              onClick={() => {
                if (!estadoAEliminar || !destinoEliminar) return;
                startTransition(async () => {
                  const resultado = await eliminarEstado(
                    estadoAEliminar.id,
                    destinoEliminar,
                  );
                  if (!resultado.ok) {
                    setError(resultado.error ?? "No se pudo eliminar");
                    return;
                  }
                  setEstadoAEliminar(null);
                  router.refresh();
                });
              }}
              className="rounded-full bg-error-container px-4 py-2 text-sm font-medium text-on-error-container disabled:opacity-60"
            >
              Eliminar estado
            </button>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={eliminandoProyecto}
        onOpenChange={setEliminandoProyecto}
        titulo="Eliminar proyecto"
        descripcion="Se borran todas sus tareas, estados y vistas. Esta acción no se puede deshacer."
      >
        <div className="space-y-3">
          <p className="rounded-xl bg-error-container/60 px-3 py-2 text-xs text-on-error-container">
            Proyecto: <strong>{proyecto.nombre}</strong>
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEliminandoProyecto(false)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                startTransition(async () => {
                  const resultado = await borrarProyecto(proyecto.id);
                  if (!resultado.ok) {
                    setError(resultado.error ?? "No se pudo eliminar");
                    return;
                  }
                  router.push("/tareas");
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-error px-4 py-2 text-sm font-medium text-on-error"
            >
              {pendiente ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Eliminar definitivamente
            </button>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}
