"use client";

import { createElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Proyecto } from "@/modules/tareas/schema";
import { paleta, prefijoDe } from "@/modules/tareas/constantes";
import { iconoDe } from "@/modules/tareas/iconos";
import {
  actualizarProyecto,
  crearProyecto,
} from "@/modules/tareas/actions/proyectos";
import { Dialogo } from "@/components/ui/dialogo";
import { SelectorColor } from "./ui/selector-color";
import { SelectorIcono } from "./ui/selector-icono";

export function DialogoProyecto({
  abierto,
  onOpenChange,
  proyecto,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  proyecto?: Proyecto;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [nombre, setNombre] = useState(proyecto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "");
  const [color, setColor] = useState(proyecto?.color ?? paleta[0]);
  const [icono, setIcono] = useState(proyecto?.icono ?? "proyecto");
  const [prefijo, setPrefijo] = useState(proyecto?.prefijo ?? "");
  const [prefijoManual, setPrefijoManual] = useState(Boolean(proyecto));
  const [error, setError] = useState<string | null>(null);

  const prefijoMostrado =
    prefijoManual && prefijo ? prefijo : prefijoDe(nombre || "tarea");
  const Icono = iconoDe(icono, "proyecto");

  function confirmar() {
    const valor = nombre.trim();
    if (!valor) {
      setError("Escribí un nombre para el proyecto");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (proyecto) {
        const resultado = await actualizarProyecto(proyecto.id, {
          nombre: valor,
          descripcion: descripcion.trim() || null,
          color,
          icono,
          prefijo: prefijoMostrado,
        });
        if (!resultado.ok) {
          setError(resultado.error ?? "No se pudo guardar");
          return;
        }
        onOpenChange(false);
        router.refresh();
        return;
      }

      const resultado = await crearProyecto({
        nombre: valor,
        descripcion: descripcion.trim() || null,
        color,
        icono,
        prefijo: prefijoMostrado,
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear el proyecto");
        return;
      }
      onOpenChange(false);
      router.push(`/tareas/proyectos/${resultado.slug}`);
    });
  }

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={(valor) => {
        if (!valor) setError(null);
        onOpenChange(valor);
      }}
      titulo={proyecto ? "Ajustes del proyecto" : "Nuevo proyecto"}
      descripcion={
        proyecto
          ? "Cambiá el nombre, el color o el ícono del proyecto."
          : "Se crean automáticamente cuatro estados y las cinco vistas base."
      }
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
              color: `color-mix(in oklab, ${color} 72%, var(--color-on-surface))`,
            }}
          >
            {createElement(Icono, { size: 22 })}
          </span>
          <label className="min-w-0 flex-1 text-xs font-medium text-on-surface-variant">
            Nombre
            <input
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmar();
                }
              }}
              placeholder="Casa, Trabajo, Facultad..."
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
            />
          </label>
        </div>

        <label className="block text-xs font-medium text-on-surface-variant">
          Descripción
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            rows={2}
            placeholder="Opcional"
            className="mt-1 w-full resize-none rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium text-on-surface-variant">
              Color
            </p>
            <SelectorColor valor={color} onChange={setColor} />
          </div>
          <label className="block text-xs font-medium text-on-surface-variant">
            Prefijo de ID
            <input
              value={prefijoMostrado}
              onChange={(event) => {
                setPrefijoManual(true);
                setPrefijo(event.target.value.toUpperCase().slice(0, 6));
              }}
              className="mt-1 h-9 w-24 rounded-xl border border-outline-variant/60 bg-surface-container-low px-2 text-center text-sm font-semibold tracking-wider text-on-surface outline-none focus:border-primary"
            />
            <span className="mt-1 block text-[10px] text-on-surface-variant/70">
              {prefijoMostrado}-1
            </span>
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-on-surface-variant">
            Ícono
          </p>
          <SelectorIcono valor={icono} onChange={setIcono} />
        </div>

        {error && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={confirmar}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
          >
            {pendiente && <Loader2 size={13} className="animate-spin" />}
            {proyecto ? "Guardar cambios" : "Crear proyecto"}
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
