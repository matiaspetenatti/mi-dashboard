"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResultadoExamen } from "../schema";
import {
  registrarNotaExamen,
  registrarResultadoExamen,
} from "../actions/examenes";

export function CalificacionRapida({ examenId }: { examenId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [nota, setNota] = useState("");
  const [pendiente, startTransition] = useTransition();

  function guardarNota(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nota.trim()) return;

    startTransition(async () => {
      const resultado = await registrarNotaExamen(examenId, nota);
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      toast.success("Nota guardada");
      setNota("");
      router.refresh();
    });
  }

  function guardarResultado(resultado: ResultadoExamen) {
    startTransition(async () => {
      const respuesta = await registrarResultadoExamen(examenId, resultado);
      if (!respuesta.ok) {
        toast.error(respuesta.error);
        return;
      }
      toast.success(
        resultado === "aprobado" ? "Examen aprobado" : "Examen desaprobado",
      );
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <form onSubmit={guardarNota} className="flex items-center gap-1">
        <input
          name="nota"
          inputMode="decimal"
          required
          value={nota}
          onChange={(event) => setNota(event.target.value)}
          placeholder="Nota"
          aria-label="Nota del examen"
          className="h-7 w-16 rounded-full border border-outline-variant bg-surface-container-lowest px-2 text-center text-[11px] text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
        />
        <button
          type="submit"
          disabled={pendiente}
          aria-label="Guardar nota"
          className="grid size-7 place-items-center rounded-full bg-success-container text-on-success-container disabled:opacity-60"
        >
          {pendiente ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Check size={13} />
          )}
        </button>
      </form>

      <button
        type="button"
        disabled={pendiente}
        title="Marcar aprobado"
        aria-label="Marcar examen aprobado"
        onClick={() => guardarResultado("aprobado")}
        className="grid size-7 place-items-center rounded-full bg-success-container text-on-success-container transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <ThumbsUp size={13} />
      </button>

      <button
        type="button"
        disabled={pendiente}
        title="Marcar desaprobado"
        aria-label="Marcar examen desaprobado"
        onClick={() => guardarResultado("desaprobado")}
        className="grid size-7 place-items-center rounded-full bg-error-container text-on-error-container transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}
