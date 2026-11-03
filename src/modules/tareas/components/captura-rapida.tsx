"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { capturarTareaRapida, getOrCreateInboxProject } from "@/modules/tareas/actions/tareas";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function CapturaRapida() {
  const [titulo, setTitulo] = useState("");
  const [pendiente, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function enviar() {
    const valor = titulo.trim();
    if (!valor) return;
    startTransition(async () => {
      const r = await capturarTareaRapida(valor);
      if (!r.ok) {
        toast.error(r.error ?? "No se pudo capturar");
        return;
      }
      setTitulo("");
      toast.success("Tarea capturada", { description: valor });
    });
  }

  function abrirInbox() {
    startTransition(async () => {
      await getOrCreateInboxProject();
      router.push("/tareas/proyectos/inbox");
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/50 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-pebble">
        Captura rápida
      </p>
      <div className="flex items-center gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Escribí una tarea y presioná Enter..."
          className="h-9 min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={pendiente || !titulo.trim()}
          onClick={enviar}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-60"
        >
          <Plus size={13} />
          Capturar
        </button>
      </div>
      <button
        type="button"
        onClick={abrirInbox}
        className="self-start text-[11px] text-on-surface-variant hover:text-primary"
      >
        Ver bandeja de entrada →
      </button>
    </div>
  );
}