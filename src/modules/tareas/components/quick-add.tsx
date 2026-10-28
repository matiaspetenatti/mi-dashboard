"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import type { EstadoProyecto } from "@/modules/tareas/schema";
import { crearTarea } from "@/modules/tareas/actions/tareas";
import { estadoInicial } from "@/modules/tareas/lib/orden";

export function QuickAdd({
  proyectoId,
  estados,
  estadoId,
  placeholder = "Agregar una tarea y presionar Enter",
}: {
  proyectoId: number;
  estados: EstadoProyecto[];
  estadoId?: number;
  placeholder?: string;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const destino =
    estados.find((estado) => estado.id === estadoId) ??
    estadoInicial(estados) ??
    estados[0];

  function crear() {
    const valor = titulo.trim();
    if (!valor || !destino) return;
    startTransition(async () => {
      const resultado = await crearTarea({
        proyectoId,
        estadoId: destino.id,
        titulo: valor,
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear la tarea");
        return;
      }
      setTitulo("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        crear();
      }}
      className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2"
    >
      <div className="flex items-center gap-2">
        {pendiente ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
        ) : (
          <Plus size={16} className="shrink-0 text-primary" />
        )}
        <input
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder={placeholder}
          aria-label="Título de la nueva tarea"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
        {destino && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] text-on-surface-variant sm:inline-flex">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full"
              style={{ backgroundColor: destino.color }}
            />
            {destino.nombre}
          </span>
        )}
        <button
          type="submit"
          disabled={!titulo.trim() || pendiente}
          className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
      {error && <p className="mt-1 pl-6 text-[11px] text-error">{error}</p>}
    </form>
  );
}
