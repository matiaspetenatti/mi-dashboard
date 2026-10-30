"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { crearTarea } from "@/modules/tareas/actions/tareas";
import { estadoInicial } from "@/modules/tareas/lib/orden";
import type { ProyectoNav } from "@/modules/tareas/lib/navegacion";
import { useToast } from "@/hooks/use-toast";
import { Dialogo } from "@/components/ui/dialogo";

export function DialogoNuevaTarea({
  abierto,
  onOpenChange,
  proyectos,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  proyectos: ProyectoNav[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();
  const [proyectoId, setProyectoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [error, setError] = useState<string | null>(null);

  const predeterminado =
    proyectos.find((proyecto) => !proyecto.archivado) ?? proyectos[0] ?? null;
  const seleccionado =
    proyectos.find((proyecto) => proyecto.id === proyectoId) ?? predeterminado;

  function cerrar() {
    onOpenChange(false);
    setError(null);
  }

  function crear() {
    const valor = titulo.trim();
    if (!valor || !seleccionado) return;

    const estado = estadoInicial(seleccionado.estados);
    if (!estado) {
      setError("El proyecto no tiene estados configurados");
      return;
    }

    setError(null);
    startTransition(async () => {
      const resultado = await crearTarea({
        proyectoId: seleccionado.id,
        estadoId: estado.id,
        titulo: valor,
        fechaLimite: fechaLimite || null,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear la tarea");
        return;
      }

      toast.success("Tarea creada", {
        description: `${valor} · ${seleccionado.nombre}`,
      });
      setTitulo("");
      setFechaLimite("");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={(valor) => {
        if (!valor) setError(null);
        onOpenChange(valor);
      }}
      titulo="Nueva tarea"
      descripcion={
        proyectos.length === 0
          ? "Todavía no hay proyectos: creá uno desde el + de la sección Proyectos."
          : "Se agrega al primer estado pendiente del proyecto elegido."
      }
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          crear();
        }}
        className="space-y-3"
      >
        <label className="block text-xs font-medium text-on-surface-variant">
          Proyecto
          <select
            value={seleccionado?.id ?? ""}
            onChange={(evento) => setProyectoId(Number(evento.target.value))}
            disabled={proyectos.length === 0 || pendiente}
            className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60"
          >
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
                {proyecto.archivado ? " (archivado)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-on-surface-variant">
          Título
          <input
            autoFocus
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="¿Qué hay que hacer?"
            className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </label>

        <label className="block text-xs font-medium text-on-surface-variant">
          Fecha límite
          <input
            type="date"
            value={fechaLimite}
            onChange={(evento) => setFechaLimite(evento.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <span className="mt-1 block text-[10px] font-normal text-on-surface-variant/70">
            Opcional. Si la dejás vacía, la tarea queda en “Sin fecha”.
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={cerrar}
            className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!titulo.trim() || !seleccionado || pendiente}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {pendiente ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Crear tarea
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
