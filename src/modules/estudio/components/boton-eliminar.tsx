"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Dialogo } from "@/components/ui/dialogo";
import { Button } from "@/components/ui/button";
import type { ResultadoAccion } from "../actions/_comun";

export function BotonEliminar({
  onEliminar,
  onExito,
  titulo,
  descripcion,
  children,
  className,
  ariaLabel,
}: {
  onEliminar: () => Promise<ResultadoAccion>;
  onExito?: () => void;
  titulo: string;
  descripcion: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const resultado = await onEliminar();
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setAbierto(false);
      onExito?.();
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setAbierto(true)}
        className={cn(
          "grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container",
          className,
        )}
      >
        {children}
      </button>

      <Dialogo
        abierto={abierto}
        onOpenChange={(valor) => {
          if (!valor) setError(null);
          setAbierto(valor);
        }}
        titulo={titulo}
        descripcion={descripcion}
      >
        <div className="space-y-4">
          {error && (
            <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendiente}
              onClick={confirmar}
            >
              {pendiente ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Eliminar
            </Button>
          </div>
        </div>
      </Dialogo>
    </>
  );
}
