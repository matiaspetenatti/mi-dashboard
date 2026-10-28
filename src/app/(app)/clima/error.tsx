"use client";

import { useEffect } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClimaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el módulo de clima:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-100 text-sky-600">
        <CloudOff className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          No se pudo cargar el clima
        </h2>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Hubo un problema al consultar el pronóstico. Revisá tu conexión e
          intentá de nuevo.
        </p>
      </div>
      <Button variant="tonal" size="sm" onClick={reset}>
        <RefreshCw />
        Reintentar
      </Button>
    </div>
  );
}
