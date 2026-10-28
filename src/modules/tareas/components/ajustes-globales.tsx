"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import type { Etiqueta } from "@/modules/tareas/schema";
import { colorPorDefecto, paleta } from "@/modules/tareas/constantes";
import {
  actualizarEtiqueta,
  borrarEtiqueta,
  crearEtiqueta,
} from "@/modules/tareas/actions/etiquetas";
import { EtiquetaChip } from "./chips";
import { Dialogo } from "@/components/ui/dialogo";
import { SelectorColor } from "./ui/selector-color";

type EtiquetaConUso = Etiqueta & { usos: number };

export function AjustesGlobales({
  etiquetas,
}: {
  etiquetas: EtiquetaConUso[];
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Etiqueta | null>(null);
  const [eliminando, setEliminando] = useState<Etiqueta | null>(null);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState<string>(paleta[0]);
  const [error, setError] = useState<string | null>(null);

  function abrirCrear() {
    setNombre("");
    setColor(paleta[0]);
    setError(null);
    setCreando(true);
  }

  function abrirEditar(etiqueta: Etiqueta) {
    setNombre(etiqueta.nombre);
    setColor(etiqueta.color);
    setError(null);
    setEditando(etiqueta);
  }

  function guardar() {
    const valor = nombre.trim().toLowerCase();
    if (!valor) return;
    startTransition(async () => {
      const resultado = editando
        ? await actualizarEtiqueta(editando.id, { nombre: valor, color })
        : await crearEtiqueta({ nombre: valor, color });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar");
        return;
      }
      setCreando(false);
      setEditando(null);
      setNombre("");
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 flex-1 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Ajustes
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-on-surface">
            Etiquetas globales
          </h1>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
            Las etiquetas se comparten entre todos los proyectos y sirven para
            filtrar tareas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-on-primary"
        >
          <Plus size={13} />
          Nueva etiqueta
        </button>
      </header>

      {etiquetas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-12 text-center">
          <Tag size={22} className="mx-auto text-on-surface-variant" />
          <p className="mt-2 text-sm font-medium text-on-surface">
            Todavía no hay etiquetas
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Creá etiquetas como <span className="font-medium">casa</span>,{" "}
            <span className="font-medium">trabajo</span> o{" "}
            <span className="font-medium">urgente</span>.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
          {etiquetas.map((etiqueta) => (
            <li
              key={etiqueta.id}
              className="group flex items-center gap-3 px-3 py-2.5"
            >
              <EtiquetaChip etiqueta={etiqueta} />
              <span className="text-[11px] text-on-surface-variant">
                {etiqueta.usos}{" "}
                {etiqueta.usos === 1 ? "tarea" : "tareas"}
              </span>
              <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Editar etiqueta"
                  onClick={() => abrirEditar(etiqueta)}
                  className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar etiqueta"
                  onClick={() => {
                    setError(null);
                    setEliminando(etiqueta);
                  }}
                  className="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-error"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl bg-surface-container-low/60 p-4 text-xs leading-relaxed text-on-surface-variant">
        <p className="font-medium text-on-surface">Cómo funcionan</p>
        <p className="mt-1">
          Podés crear etiquetas desde este panel o directamente al escribir una
          nueva dentro del detalle de una tarea. Al eliminar una etiqueta se
          quita de todas las tareas.
        </p>
      </div>

      <Dialogo
        abierto={creando || editando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setCreando(false);
            setEditando(null);
            setError(null);
          }
        }}
        titulo={editando ? "Editar etiqueta" : "Nueva etiqueta"}
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-on-surface-variant">
            Nombre
            <input
              autoFocus
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                if (!editando) setColor(colorPorDefecto(event.target.value));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  guardar();
                }
              }}
              placeholder="casa, trabajo, urgente..."
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
            />
          </label>

          <div>
            <p className="mb-1.5 text-xs font-medium text-on-surface-variant">
              Color
            </p>
            <SelectorColor valor={color} onChange={setColor} />
          </div>

          {nombre.trim() && (
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-on-surface-variant">
                Vista previa
              </p>
              <EtiquetaChip etiqueta={{ nombre, color, icono: null }} />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCreando(false);
                setEditando(null);
              }}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente || !nombre.trim()}
              onClick={guardar}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              {pendiente && <Loader2 size={13} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={eliminando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEliminando(null);
        }}
        titulo="Eliminar etiqueta"
        descripcion="Se quitará de todas las tareas que la usan."
      >
        <div className="space-y-3">
          {eliminando && <EtiquetaChip etiqueta={eliminando} />}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEliminando(null)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                if (!eliminando) return;
                startTransition(async () => {
                  const resultado = await borrarEtiqueta(eliminando.id);
                  if (!resultado.ok) {
                    setError(resultado.error ?? "No se pudo eliminar");
                    return;
                  }
                  setEliminando(null);
                  router.refresh();
                });
              }}
              className="rounded-full bg-error-container px-4 py-2 text-sm font-medium text-on-error-container disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}
